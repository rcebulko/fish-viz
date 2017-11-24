var http = require('http'),
    sqlRouter = require('sequelize-router'),

    express = require('express'),
    app = express(),

    schema = require('./schema'),

    argv = require('minimist')(process.argv.slice(2), {
        default: { port: 90 }
    });


// generate the modified find function for the sequel router to enable limiting
function findAllOpts(Model, opts) {
    return (req, res) => {
        var limit = req.query.limit;
        delete req.query.limit;

        Model.findAll(Object.assign({
            where: req.query,
            limit: limit
        }, opts)).then(dbModel => {
            res.json(dbModel);
        }).catch(err => {
            res.json(err);
        });
    }
}

// start the server listening on port `port`
function start(port) {
    http.createServer(app).listen(port, function () {
        console.log('Express server listening on port ' + port);
    });
};


// establish API endpoints for each model
app.use('/api', sqlRouter(schema.Species, {
    find: findAllOpts(schema.Species)
}));
app.use('/api', sqlRouter(schema.Sample, {
    find: findAllOpts(schema.Sample, { include: [schema.Species] })
}));
// establish static assets path
app.use(express.static('public'));


if (require.main === module) {
    start(argv['port']);
}

module.exports = { start }
