var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

// Create our Express application
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// Use environment defined port or 3000
var port = process.env.PORT || 3000;

var routes = require('./api/route/routes'); //importing route
routes(app); //register the route

// Start the server
app.listen(port);
console.log('Insert beer on port ' + port);