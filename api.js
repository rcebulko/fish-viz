var express = require('express'),
    http = require('http'),
    seqRouter = require('sequelize-router'),

    schema = require('./schema')

    app = express(),

    PORT = 90;

app.use('/api', seqRouter(schema.Species));

http.createServer(app).listen(PORT, function () {
    console.log('Express server listening on port ' + PORT);
})
