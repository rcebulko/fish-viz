var express = require('express'),
    http = require('http'),
    seqRouter = require('sequelize-router'),

    schema = require('./schema')

    app = express(),

    PORT = 90;

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

app.use('/api', seqRouter(schema.Species, {
    find: findAllLimit(schema.Species)
}));
app.use('/api', seqRouter(schema.Sample), {
    find: findAllLimit(schema.Sample)
});

http.createServer(app).listen(PORT, function () {
    console.log('Express server listening on port ' + PORT);
})
