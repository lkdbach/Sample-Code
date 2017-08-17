var express = require('express');
var bodyParser = require('body-parser');
var unless = require('express-unless');
var jwt = require('express-jwt')
var config = require('./config/database');

// Create our Express application
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

var jwtCheck = jwt({
    secret: config.secret
});

jwtCheck.unless = unless;
app.use(jwtCheck.unless({path: ['/signup', '/login']}));

app.use(bodyParser.json());

// Use environment defined port or 3000
var port = process.env.PORT || 3000;

var routes = require('./api/route/routes'); //importing route
routes(app); //register the route

// Start the server
app.listen(port);
console.log('Host is listening on port ' + port);