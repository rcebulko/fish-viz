var csv = require('fast-csv'),
    fs = require('fs'),
    Transaction = require('sequelize').Transaction,

    schema = require('./schema.js'),

    DATA_PATH = 'C:/Users/Ryan/Downloads/fish_data/',
    // DATA_PATH = './data/',

    READ_LOG_INTERVAL = 10000,
    WRITE_BATCH_SIZE = 10000,

    argv = require('minimist')(process.argv.slice(2), {
        boolean: ['species', 'samples'],
    });


function importRecords(csvStream, Model, convert) {
    return new Promise((resolve, reject) => {
        var read = 0,
            written = 0,
            batch = [],
            inserts = [],
            converted,

            insertAll = () => {
                inserts.push(
                    Model.bulkCreate(batch, {
                        ignoreDuplicates: true
                    }).then(results => {
                        written += results.length;
                        console.log('Written (%s): %d', Model.name, written);
                    })
                );

                batch = [];
            };

        csv.fromStream(csvStream, { headers: true }).on('data', rec => {
            converted = convert(rec);

            read++;
            if (read % READ_LOG_INTERVAL === 0) {
                console.log('Read (%s): %d', Model.name, read);
            }

            if (converted) {
                batch.push(converted);

                if (batch.length % WRITE_BATCH_SIZE === 0) {
                    insertAll();
                }
            }
        }).on('end', () => {
            insertAll()
            Promise.all(inserts).then(() => { resolve(written); });
        }).on('error', e => {
            console.error(e);
            reject(e);
        });
    }).then((count) => {
        console.log('Added (%s): %d', Model.name, count)
        return Model.count();
    });
}


function importSpeciesRecords(csvFile) {
    return importRecords(csvFile, schema.Species, speciesFromRecord);
}

function importSampleRecords(csvFile) {
    return schema.Species.findAll({ attributes: ['code'] }).then(results => {
        var codes = results.map(s => s.code),

            // ensure we don't try to create samples for missing species
            filteredSampleFromRecord = record => {
                var sample = sampleFromRecord(record);

                if (sample && codes.indexOf(sample.species_code) !== -1) {
                    return sample
                }
            };

        return importRecords(csvFile, schema.Sample, filteredSampleFromRecord);
    });
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
            species_code: record.SPECIES_CD,
            region: record.REGION,
            date: new Date(record.YEAR, record.MONTH, record.DAY),
            latitude: +record.LAT_DEGREES,
            longitude: +record.LON_DEGREES,
            depth: +record.DEPTH,
            length: +record.LEN,
            number: +record.NUM,
            protected: !!record.PROT,
        }
    }
}


function importSpecies(filename) {
    return schema.Species.sync({ force: true })
        .then(() => {
            return importSpeciesRecords(fs.createReadStream(DATA_PATH + filename));
        }).then(total => {
            console.log('Total species: %d', total);
        });
}

function importSamples(filename) {
    return schema.Sample.sync({ force: true })
        .then(() => {
            return importSampleRecords(fs.createReadStream(DATA_PATH + filename));
        }).then(total => {
            console.log('Total samples: %d', total);
        });
}


// `node import_data --species` --> imports species data
// `node import_data --sample` --> imports sample data
if (require.main === module) {
    var imports = [],
        args = process.argv.slice(2),
        importComplete = () => {
            if (!argv['port']) {
                process.exit();
            } else {
                console.log('Import complete! Server will remain online.');
            }
        };

    if (argv['species']) { imports.push(importSpecies('taxa.csv')); }
    if (argv['samples']) { imports.push(importSamples('samples.csv')); }

    // optionally run server while import is in progress
    if (argv['port']) {
        Promise.all([Species.sync(), Sample.sync()]).then(() => {
            require('./server').start(+argv['port']);
        });
    }

    Promise.all(imports).then(importComplete, e => {
        console.error(e);
        importComplete()
    });

}

module.exports = { importSpecies, importSamples }
