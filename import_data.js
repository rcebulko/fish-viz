var csv = require('fast-csv'),
    fs = require('fs'),
    request = require('request'),
    Transaction = require('sequelize').Transaction,

    schema = require('./schema.js'),

    DATA_PATH = 'C:/Users/Ryan/Downloads/fish_data/',

    READ_LOG_INTERVAL = 10000,
    WRITE_BATCH_SIZE = 10000;


function importRecords(csvStream, Model, convert) {
    var inserts = [];

    return new Promise((resolve, reject) => {
        var count = 0,
            read = 0,
            written = 0,
            built = [],
            inserts = [],
            converted;

        csv.fromStream(csvStream, {  headers: true }).on('data', rec => {
            converted = convert(rec);

            read++;
            if (read && read % READ_LOG_INTERVAL === 0) {
                console.log('Read (%s): %d', Model.name, read);
            }

            if (converted) {
                built.push(Model.build(converted));
                count++;

                if (count && count % WRITE_BATCH_SIZE === 0) {
                    inserts.push(
                        Model.bulkCreate(built).then(results => {
                            written += results.length;
                            console.log('Written (%s): %d', Model.name, written);
                        })
                    );

                    built = []
                }
            }
        }).on('end', () => {
            inserts.push(
                Model.bulkCreate(built).then(results => {
                    written += results.length;
                    console.log('Written (%s): %d', Model.name, written);
                })
            );

            Promise.all(inserts).then(() => { resolve(written); });
        }).on('data-invalid', badData => {
            console.error('Invalid data:', badData);
        }).on('error', e => {
            console.error(e);
            reject(e);
        });
    }).then((count) => {
        console.log('Added %d', count)
        return Model.count();
    });
}


function importSpeciesRecords(csvFile) {
    return importRecords(csvFile, schema.Species, speciesFromRecord);
}

function importSampleRecords(csvFile) {
    return importRecords(csvFile, schema.Sample, sampleFromRecord);
}


function speciesFromRecord(record) {
    if (record.SPECIES_CD) {
        return {
            code: record.SPECIES_CD,
            species: record.SCINAME.split(' ')[1],
            genus: record.SCINAME.split(' ')[0],
            family: record.FAMILY,
            scientificName: record.SCINAME,
            commonName: record.COMNAME,
            minLength: +record.LC,
            medLength: +record.LM,
        }
    }
}

function sampleFromRecord(record) {
    if (+record.NUM) {
        return {
            date: new Date(record.YEAR, record.MONTH, record.DAY),
            latitude: +record.LAT_DEGREES,
            longitude: +record.LON_DEGREES,
            depth: +record.DEPTH,
            length: +record.LEN,
            number: +record.NUM,
            protected: !!record.PROT,
            region: record.REGION,
        }
    }
}


Promise.all([
    importSpeciesRecords(fs.createReadStream(DATA_PATH + 'taxa.csv'))
        .then(total => { console.log('Total species: %d', total); }),
    importSampleRecords(fs.createReadStream(DATA_PATH + 'samples.csv'))
        .then(total => { console.log('Total samples: %d', total); })
]).then(() => {
    process.exit();
}, e => {
    console.error(e);
    process.exit();
});
