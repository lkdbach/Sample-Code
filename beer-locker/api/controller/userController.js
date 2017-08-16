var mysql = require('mysql');
var db = require('../../config/database');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');

var connection = mysql.createPool(db.connection);
connection.query('USE ' + db.database);


exports.sign_up = function (req, res) {
    var newUser = {
        username: req.body.user.username,
        password: req.body.user.password
    };
    connection.query('SELECT username FROM users WHERE username = ?', [newUser.username], function (err, rows) {
        connection.release();
        if (err) {
            throw err;
        }
        if (rows.length) {
            return res.json({message: 'username already exists'})
        } else {

            newUser.password = bcrypt.hash(newUser.password, null, null);

            connection.query('INSERT INTO users ( username, password ) values (?, ?)', [newUser.username, newUser.password],
                function (err, rows) {
                    if (err) {
                        throw err;
                    }

                    newUser.id = rows.insertId;
                    return json(newUser);
                }
            );
        }

    })
};

exports.log_in = function (req, res) {

};

exports.loginRequired = function (req, res, next) {

};

exports.list_users = function (req, res) {

};

