    // imports
var express = require("express"),
    bodyParser = require("body-parser"),
    gzip = require("compression"),
    context = require("restful-express-sequelize"),

    // model genera
    // ted by sequelize-cli
    // (sequelize model:create --name Framework --attributes name:string,lang:string)
    dbContext = require("./models");
    // bind over ip and port instead of 127.0.0.1
    port = process.env.PORT || 52192,
    host = process.env.HOST || "127.0.0.1" || "192.168.1.100",

    // express instance
    server = express(),

    models, property;

// register body-parser middleware
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// register compression middleware
server.use(gzip({
    filter: function (req, res) { return !req.headers["x-no-gzip"]; }
}));

// get items from models
models = [];
for (property in dbContext) {
  // register as options you can add { model: xxx, methods: ["get", "post"] }
  // methods are (optional) defaults all registered ["get", "post", "put", "delete"]
  models.push({ model: dbContext[property] });
}

// finally register your method(s) on base as '/v1/endpoint'
// base is (optional) context.Resource.register(server, model)
// port is (optional) context.Resource.register(server, model) if port is not 80 then we bind
// if you use it in local project or port specified on others it will be useful.
context.Resource.register(server, models, "/api", port);

// start serving
server.listen(port, host, function () {
  console.log("Server Running...");
});
