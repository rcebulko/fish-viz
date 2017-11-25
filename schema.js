var Sequelize = require('sequelize'),

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
            fields: ['region', 'date', 'latitude', 'longitude', 'species_code'],
        }],

        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            limit: 10000,
            where: {
                date: { $between: [new Date(1999, 4), new Date(2018, 0)] },
                latitude: { $between: [24.4313, 27.18972] },
                longitude: { $between: [-83.103667, -79.9938] },
            }
        }
    }),

    Species = db.define('species', {
        code: { type: Sequelize.STRING, primaryKey: true },
        species: { type: Sequelize.STRING, field: 'species' },
        genus: { type: Sequelize.STRING, field: 'genus' },
        family: { type: Sequelize.STRING },
        scientificName: { type: Sequelize.STRING, field: 'sci_name' },
        commonName: { type: Sequelize.STRING, field: 'common_name' },
    }, {
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: {
                family: { $not: '' },
                genus: { $not: 'Unknown' },
                species: { $not: 'sp.' },
            }
        }
    });

Species.hasMany(Sample, { foreignKey: 'species_code', sourceKey: 'code' });
Sample.belongsTo(Species, { foreignKey: 'species_code', sourceKey: 'code' });


// `node schema --samples` --> creates/re-creates the `samples` table
// `node schema --species` --> creates/re-creates the `samples` table
if (require.main === module) {
    if (argv['species']) { Species.sync({ force: true }); }
    if (argv['samples']) { Sample.sync({ force: true }); }

    pruneAggregated();
}

module.exports = { db, Sample, Species }
