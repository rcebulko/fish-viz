var csv = require('fast-csv'),
    fs = require('fs'),
    Sequelize = require('sequelize')
    Transaction = Sequelize.Transaction,

    schema = require('./schema.js'),
    Sample = schema.Sample,
    Species = schema.Species,

    // DATA_PATH = 'C:/Users/Ryan/Downloads/fish_data/',
    DATA_PATH = './data/',

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
    return importRecords(csvFile, Species, speciesFromRecord);
}

function importSampleRecords(csvFile) {
    return Species.findAll({ attributes: ['code'] }).then(results => {
        var codes = results.map(s => s.code),

            // ensure we don't try to create samples for missing species
            filteredSampleFromRecord = record => {
                var sample = sampleFromRecord(record);

                if (sample && codes.indexOf(sample.species_code) !== -1) {
                    return sample
                }
            };

        return importRecords(csvFile, Sample, filteredSampleFromRecord);
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
            depth: Math.abs(record.DEPTH),
            length: Math.abs(record.LEN),
            number: Math.abs(record.NUM),
            protected: !!record.PROT,
            aggregated: false
        }
    }
}


function importSpecies(filename) {
    return Species.sync({ force: true })
        .then(() => {
            return importSpeciesRecords(fs.createReadStream(DATA_PATH + filename));
        }).then(total => {
            console.log('Total species: %d', total);
        });
}

function importSamples(filename) {
    return Sample.sync({ force: true })
        .then(() => {
            return importSampleRecords(fs.createReadStream(DATA_PATH + filename));
        }).then(total => {
            console.log('Total samples: %d', total);
        });
}


// merge samples, using the weighted average of their length and depth
function aggregateSamples() {
    return Sample.destroy({
        where: { aggregated: true }
    }).then(() => {
        // mark one-offs as aggregated
        return Sample.findAll({
            where: { aggregated: false },
            attributes: ['id'],
            group: ['region', 'date', 'latitude', 'longitude', 'species_code'],
            having: Sequelize.where(
                Sequelize.fn('COUNT', Sequelize.literal('1')), 1)
        });
    }).then(results => {
        return Sample.update({ aggregated: true}, {
            where: { id: results.map(s => { return s.dataValues.id; }) }
        }).then(count => { console.log('Aggregated %d non-dupes', count)});
    }).then(() => {
        // create aggregates for dupes
        return Sample.findAll({
            where: { aggregated: false },
            attributes: [
                'region', 'date', 'latitude', 'longitude', 'species_code', 'protected',
                [Sequelize.fn('COUNT', Sequelize.literal('1')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('number')), 'total'],
                [Sequelize.fn('SUM', Sequelize.literal('number*length')), 'lenWeight'],
                [Sequelize.fn('SUM', Sequelize.literal('number*depth')), 'depWeight'],
            ],
            group: ['region', 'date', 'latitude', 'longitude', 'species_code'],
            having: Sequelize.where(
                Sequelize.fn('COUNT', Sequelize.literal('1')),
                { $gt: 1 }
            )
        });
    }).then(results => {
        var dupeCount = 0,
            aggregates = results.map(sample => {
                sample = sample.dataValues;
                dupeCount += sample.count;

                return {
                    species_code: sample.species_code,
                    region: sample.region,
                    date: sample.date,
                    latitude: sample.latitude,
                    longitude: sample.longitude,
                    depth: sample.depWeight / sample.total,
                    length: sample.lenWeight / sample.total,
                    number: sample.total,
                    protected: sample.protected,
                    aggregated: true,
                }
            });

        console.log('Total dupe count: %d', dupeCount);

        function insertNextChunk() {
            console.log('%d aggregations remaining', aggregates.length);

            if (aggregates.length) {
                return Sample.bulkCreate(aggregates.splice(-10000))
                    .then(rs => {
                        console.log('Created %d aggregated samples', rs.length);
                    })
                    .then(insertNextChunk);
            }
        }

        return insertNextChunk();
    });
}
// prune samples that have been merged
function pruneAggregated() {
    return Sample.destroy({
        where: { aggregated: false },
    }).then(count => {
        console.log('Pruned %d pre-aggregation samples', count);
    });
}


// `node import_data --species` --> imports species data
// `node import_data --sample` --> imports sample data
if (require.main === module) {
    var chain = Promise.all([]),
        args = process.argv.slice(2),
        agg = false,
        importComplete = () => {
            if (!argv['port']) {
                process.exit();
            } else {
                console.log('Server will remain online.');
            }
        };

    if (argv['species']) {
        chain = chain.then(() => { return importSpecies('taxa.csv'); });
    }
    if (argv['samples']) {
        chain = chain.then(() => { return importSamples('samples.csv'); });
    }

    // optionally run server while import is in progress
    if (argv['port']) {
        Promise.all([
            Species.sync(),
            Sample.sync()
        ]).then(() => {
            require('./server').start(+argv['port']);
        });
    }

    chain.then(() => {
        console.log('Import completed!');
        if (argv['aggregate']) {
            console.log('Aggregating samples...');
            return aggregateSamples().then(pruneAggregated);
        }
    }).then(importComplete, e => {
        console.error(e);
        importComplete()
    });

}

module.exports = { importSpecies, importSamples }
