var mysql = require("mysql");

var config = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "1234",
    "database": "Banking"
};

mysql.createConnection(config);
exports.sqlDb = mysql;