var Sequelize = require('sequelize'),
    Op = Sequelize.Op,

    argv = require('minimist')(process.argv.slice(2), {
        boolean: ['log-sql', 'species', 'samples']
    }),

    db = new Sequelize('fish_viz', 'admin', 'fishvizpass', {
        host: 'localhost',
        dialect: 'sqlite',

        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },

        storage: 'sqlite.db',
        logging: argv['log-sql'],
    }),

    REGIONS = Sequelize.ENUM('FLA KEYS', 'DRY TORT', 'SEFCRI'),

    Sample = db.define('sample', {
        species_code: { type: Sequelize.STRING },
        date: { type: Sequelize.DATE },
        latitude: { type: Sequelize.FLOAT },
        longitude: { type: Sequelize.FLOAT },
        depth: { type: Sequelize.FLOAT },
        length: { type: Sequelize.FLOAT, },
        number: { type: Sequelize.INTEGER },
        protected: { type: Sequelize.BOOLEAN },
        region: { type: REGIONS },
        aggregated: { type: Sequelize.BOOLEAN }
    }, {
        indexes: [{
            unique: true,
            fields: ['region', 'date', 'latitude', 'longitude', 'species_code', 'length']
        }],

        defaultScope: {
            date: { [Op.between]: [new Date(1999, 4), new Date(2018)] },
            latitude: { [Op.between]: [24.4313, 27.18972] },
            longitude: { [Op.between]: [-83.103667, -79.9938] },
        }
    }),

    Species = db.define('species', {
        code: { type: Sequelize.STRING, primaryKey: true },
        species: { type: Sequelize.STRING, field: 'species' },
        genus: { type: Sequelize.STRING, field: 'genus' },
        family: { type: Sequelize.STRING },
        scientificName: { type: Sequelize.STRING, field: 'sci_name' },
        commonName: { type: Sequelize.STRING, field: 'common_name' },
    });

Species.hasMany(Sample, { foreignKey: 'species_code', sourceKey: 'code' });
Sample.belongsTo(Species, { foreignKey: 'species_code', sourceKey: 'code' });

function aggregateSamples() {
    Sample.findAll({
        where: { aggregated: null },
        attributes: [
            'region', 'date', 'latitude', 'longitude', 'species_code', 'protected',
            'length', 'depth',
            [Sequelize.fn('SUM', Sequelize.col('number')), 'total'],
            [Sequelize.fn('SUM', Sequelize.literal('number*length')), 'lenWeight'],
            [Sequelize.fn('SUM', Sequelize.literal('number*depth')), 'depWeight'],
        ],
        group: ['region', 'date', 'latitude', 'longitude', 'species_code'],
        having: Sequelize.where(
            Sequelize.fn('COUNT', Sequelize.literal('1')),
            { $gt: 1 }
        )
    }).then(results => {
        aggregates = results.map(sample => {
            sample = sample.dataValues;
            return {
                species_code: sample.species_code,
                region: sample.region,
                date: sample.date,
                latitude: sample.latitude,
                longitude: sample.longitude,
                depth: sample.depWeight / sample.total,
                length: -sample.lenWeight / sample.total,
                number: sample.total,
                protected: sample.protected,
                aggregated: true,
            }
        });

        function insertNextChunk() {
            return new Promise((resolve, reject) => {
                if (aggregates.length) {
                    console.log('%d aggregations remaining', aggregates.length);
                    return Sample.bulkCreate(aggregates.splice(-10000))
                        .then(insertNextChunk);
                } else {
                    resolve();
                }
            });
        }

        insertNextChunk();
    });
}

function pruneAggregated() {
    Sample.destroy({
        where: { aggregated: null },
        group: ['region', 'date', 'latitude', 'longitude', 'species_code'],
        having: Sequelize.where(
            Sequelize.fn('COUNT', Sequelize.literal('1')),
            { $gt: 1 }
        )
    });
}

// `node schema --samples` --> creates/re-creates the `samples` table
// `node schema --species` --> creates/re-creates the `samples` table
if (require.main === module) {
    if (argv['species']) { Species.sync({ force: true }); }
    if (argv['samples']) { Sample.sync({ force: true }); }

    pruneAggregated();
}

module.exports = { db, Sample, Species }
