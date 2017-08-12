module.exports = function (app, passport) {
    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/profile',
            failureRedirect: '/login',
            failureFlash: true
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 *3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/')
        }
    );

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/login',
        failureRedirect: '/signup',
        failureFlash: true
        })
    );

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });



};

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        next();
    }

    res.redirect('/');

}