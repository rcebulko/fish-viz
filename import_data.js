var csv = require('fast-csv'),

    schema = require ('./schema.js'),

    DATA_PATH = 'data/';

function importRecords(csvFile, Model, convert) {
    return new Promise((resolve, reject) => {
        var count = 0;

        csv.fromPath(DATA_PATH + csvFile, { headers: true })
            .on('data', (rec) => {
                Model.create(convert(rec));
                count++;
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
        minLength: Number(record.LC),
        medLength: Number(record.LM),
    }
}
function sampleFromRecord(record) {
    return {
        date: new Date(record.YEAR, record.MONTH, record.DAY),
        latitude: record.LAT_DEGREES,
        longitude: record.LON_DEGREES,
        depth: record.DEPTH,
        length: record.LEN,
        number: record.NUM,
        protected: record.PROT,
        region: record.REGION,
        station: record.STATION_NR,
    }
}


// importSampleRecords('fk2016.csv').then(() => {

// })
importSpeciesRecords('taxonomic_data.csv').then(() => {
    schema.Species.findOne().then((s) => {
        console.log(s.dataValues);
    });
})
