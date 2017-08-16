modules.exports = function (app) {
    var userController = require('../controller/userController');

    app.route('/signup')
        .post(userController.sign_up);
};