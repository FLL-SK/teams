module.exports = function(app){
    app.use('/', require('../routes/index.js'));
    app.use('/profile', require('../routes/profile.js'));
    app.use('/login', require('../routes/login.js'));
    app.use('/signup', require('../routes/signup.js'));
    app.get('/logout',
        function(req, res){
            req.logout();
            res.redirect('/');
        });

// catch 404 and forward to error handler
    app.use(function(req, res, next) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

// error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

};
