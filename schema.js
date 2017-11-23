var Sequelize = require('sequelize'),

    db = new Sequelize('fish_viz', 'admin', 'fishvizpass', {
        host: 'localhost',
        dialect: 'sqlite',

        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },

        storage: 'sqlite.db',
        logging: false,
    }),

    REGIONS = Sequelize.ENUM('FLA KEYS', 'DRY TORT', 'SEFCRI'),

    // deprecated
    // SampleSet = db.define('sample_set', {
    //     region: { type: REGIONS, unique: 'sampling'},
    //     year: { type: Sequelize.INTEGER, unique: 'sampling' },
    //     dataFile: { type: Sequelize.STRING, field: 'data_file' },
    //     count: { type: Sequelize.INTEGER, field: 'sample_count' },
    // }),

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
    }, {
        indexes: [{
            unique: true,
            fields: ['region', 'date', 'latitude', 'longitude', 'species_code', 'length']
        }]
    }),

    Species = db.define('species', {
        code: { type: Sequelize.STRING, primaryKey: true },
        species: { type: Sequelize.STRING, field: 'species' },
        genus: { type: Sequelize.STRING, field: 'genus' },
        family: { type: Sequelize.STRING },
        scientificName: { type: Sequelize.STRING, field: 'sci_name' },
        commonName: { type: Sequelize.STRING, field: 'common_name' },
        minLength: { type: Sequelize.FLOAT, field: 'min_length' },
        medLength: { type: Sequelize.FLOAT, field: 'med_length' },
    });

Species.hasMany(Sample, { foreignKey: 'species_code', sourceKey: 'code' });
Sample.belongsTo(Species, { foreignKey: 'species_code', sourceKey: 'code' });
// SampleSet.hasMany(Sample, { onDelete: 'cascade' });


module.exports = { db, Sample, Species }

if (require.main == module) {
    process.argv.slice(2).forEach(modelName => {
        Model = module.exports[modelName];
        if (typeof Model !== 'undefined') {
            Model.sync({ force: true });
        }
    })
}
