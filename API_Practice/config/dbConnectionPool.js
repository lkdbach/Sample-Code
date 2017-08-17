var dbConfig = require('./database');
var mysql = require('mysql');

var pool = mysql.createPool(dbConfig.connection);

var getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        callback(err, connection);
    });
};

module.exports = getConnection;