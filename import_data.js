var csv = require('fast-csv'),
    fs = require('fs'),
    request = require('request'),
    Transaction = require('sequelize').Transaction,

    schema = require('./schema.js'),

    API_PATH = 'https://grunt.sefsc.noaa.gov/rvc_analysis20',

    read = 0, written = 0,
    READ_LOG_INTERVAL = 10000
    WRITE_BATCH_SIZE = 10000;

function importRecords(csvStream, Model, convert) {
    var inserts = [];

    return new Promise((resolve, reject) => {
        var count = 0,
            built = [],
            inserts = [],
            converted;

        csv.fromStream(csvStream, { headers: true })
            .on('data', rec => {
                converted = convert(rec);

                read++;
                if (read && read % READ_LOG_INTERVAL === 0) {
                    console.log('Read: %d', read);
                }

                if (converted) {
                    built.push(Model.build(converted));
                    count++;

                    if (count && count % WRITE_BATCH_SIZE === 0) {
                        inserts.push(
                            Model.bulkCreate(built).then(results => {
                                written += results.length;
                                console.log('Written: %d', written);
                            })
                        );

                        built = []
                    }
                }
            })
            .on('end', () => {
                Model.bulkCreate(inserts).then(results => {
                 resolve(results.length);
             })
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

// deprecated
// function sampleSetUrl(region, year) {
//     return API_PATH + '/samples' +
//         '?region=' + region.replace(/ /g, '+') +
//         '&year=' + year +
//         '&format=csv&commit=Download';
// }

// deprecated; multi-file use
// function importSampleSet(region, year) {
//     var url = sampleSetUrl(region, year);

//     console.log('Fetching `%s`...', url);

//     return schema.db.transaction({
//         isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
//     }, transaction => {
//         return schema.SampleSet.create({
//             region: region,
//             year: year,
//             dataFile: url,
//         }).then(ss => {
//             return importSampleRecords(request(ss.dataFile))
//                 .then(total => {
//                     console.log('Total: %d', total);
//                     return ss.updateAttributes({ total: total });
//                 }, error => {
//                     ss.destroy().then(() => { throw error; })
//                 });
//         });
//     }).then(() => {
//         return schema.Sample.findOne();
//     }).then(s => {
//         console.log(s.dataValues);
//     });
// }

function importSpecies() {
    return schema.Species.sync({ force: true })
        .then(() => {
            return request(API_PATH + '/taxa.csv?commit=Download');
        }).then(importSpeciesRecords)
        .then(total => {
            console.log('Total: %d', total);
            return schema.Species.findOne();
        }).then(s => {
            console.log(s.dataValues);
        });
}

// importSampleSet('FLA KEYS', 2016).then(
//     () => { process.exit(); },
//     (e) => {
//         console.error(e);
//         process.exit();
//     })

importSampleRecords(fs.createReadStream('data/fk2016.csv'))
    .then(total => { console.log('Total: %d', total); })
    .then(() => {
        process.exit();
    }, e => {
        console.error(e);
        process.exit();
    });
