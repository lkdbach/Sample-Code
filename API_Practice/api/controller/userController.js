var mysql = require('mysql');
var db = require('../../config/database');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var connection = require('../../config/dbConnectionPool');

exports.sign_up = function (req, res) {
    var newUser = {
        username: req.body.user.username,
        password: req.body.user.password
    };

    connection(function (err, conn) {
        conn.query('SELECT username FROM users WHERE username = ?', [newUser.username], function (err, rows) {
            if (err) {
                return res.json(err);
            }
            if (rows.length) {
                return res.json({message: 'username already exists'})
            } else {
                newUser.password = bcrypt.hashSync(newUser.password, null, null);
                conn.query('INSERT INTO users ( username, password ) values (?,?)', [newUser.username, newUser.password],
                    function (err, rows) {

                        if (err) {
                            return res.json(err);
                        }
                        newUser.id = rows.insertId;
                        return res.json({
                            success: true,
                            id: newUser.id,
                            username: newUser.username
                        });
                    }
                );
            }
        })
    })
};

exports.login = function (req, res) {
    var user = {
        username: req.body.user.username,
        password: req.body.user.password
    };
    connection(function (err, conn) {
        conn.query('SELECT password FROM users WHERE username = ?', [user.username], function (err, rows) {
            if (err) {
                return res.json(err);
            }
            if (!rows.length) {
                return res.json({message: 'user not found'})
            }

            if (!bcrypt.compareSync(user.password, rows[0].password)) {
                return res.json({message: 'password is wrong'})
            }

            var token = jwt.sign(user, db.secret, {
                expiresIn: '1h'
            });

            res.json({
                success: true,
                message: 'Enjoy your token',
                token: token
            })
        })
    });

};

exports.loginRequired = function (req, res, next) {

};

exports.list_users = function (req, res) {

};

