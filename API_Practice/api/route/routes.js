var config = require('../../config/database')


module.exports = function (app) {
    var userController = require('../controller/userController');

    app.route('/signup')
        .post(userController.sign_up);

    app.route('/login')
        .post(userController.login);
};