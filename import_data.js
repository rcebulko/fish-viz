var csv = require('fast-csv'),

    schema = require ('./schema.js'),

    DATA_PATH = 'data/'

    read = 0, written = 0;

function importRecords(csvFile, Model, convert) {
    return new Promise((resolve, reject) => {
        var count = 0,
            converted;

        csv.fromPath(DATA_PATH + csvFile, { headers: true })
            .on('data', (rec) => {
                converted = convert(rec);

                read++;
                if (read && read % 1000 === 0) { console.log('Read: %d', read); }

                if (converted) {
                    Model.create(converted);
                    count++;

                    written++
                    if (written && written % 100 === 0) { console.log('Written: %d', written); }
                }

            })
            .on('end', () => { resolve(count); })
            .on('error', (e) => { reject(e); });
    }).then((count) => {
        return new Promise((resolve, reject) => {
            Model.count().then((total) => {
                resolve(count, total);
            }, reject )
        });
    }).then((count, total) => {
        console.log('Added %d records\nTotal of %d records',
            count, total);

        return total
    });
}

function importSpeciesRecords(csvFile) {
    return importRecords(csvFile, schema.Species, speciesFromRecord);
}
function importSampleRecords(csvFile) {
    return importRecords(csvFile, schema.Sample, sampleFromRecord);
}

function speciesFromRecord(record) {
    return {
        code: record.SPECIES_CD,
        species: record.SPECIES_CD.split(' ')[1],
        genus: record.SPECIES_CD.split(' ')[0],
        family: record.FAMILY,
        scientificName: record.SCINAME,
        commonName: record.COMNAME,
        minLength: +record.LC,
        medLength: +record.LM,
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


// importSampleRecords('fk2016.csv').then(() => {

// })
schema.Sample.sync({force: true})
    .then(() => {
        return importSampleRecords('fk2016.csv')
    }).then((total) => {
        console.log('Total: %d', total);
        return schema.Sample.findOne();
    }).then((s) => {
        console.log(s.dataValues);
        process.exit();
    });
