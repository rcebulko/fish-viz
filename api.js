var http = require('http'),
    sqlRouter = require('sequelize-router'),

    cors = require('cors'),
    express = require('express'),
    app = express(),

    schema = require('./schema'),

    argv = require('minimist')(process.argv.slice(2), {
        default: { port: 90 }
    });

// generate the modified find function for the sequel router to enable limiting
function findAllLimit(Model) {
    return (req, res) => {
        var limit = req.query.limit;
        delete req.query.limit;

        Model.findAll({
            where: req.query,
            limit: limit
        }).then(dbModel => {
            res.json(dbModel);
        }).catch(err => {
            res.json(err);
        });
    }
}

app.use(cors())
// establish API endpoints for each model
app.use('/api', sqlRouter(schema.Species, {
    find: findAllLimit(schema.Species)
}));
app.use('/api', sqlRouter(schema.Sample, {
    find: findAllLimit(schema.Sample)
}));
app.use(express.static('public'));

// start the API listening on port `port`
function start(port) {
    http.createServer(app).listen(port, function () {
        console.log('Express server listening on port ' + port);
    });
};

if (require.main === module) {
    start(argv['port']);
}
module.exports = { start }
