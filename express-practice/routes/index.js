module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('index.ejs')
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')})
    });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')})
    });

};