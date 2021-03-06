/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const env = require('dotenv').config();
const express = require('express');
const session = require('express-session'); // express session management
const path = require('path');

const mongoose = require('mongoose'); // mongoDB object mapper
mongoose.Promise = require('bluebird'); // mongoose promises are deprecated, replacing with bluebird
// compile DB models
require('./models');

const favicon = require('serve-favicon'); // favicon
const logger = require('morgan'); // logging
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const debugLib = require('debug')('app');
const logERR = require('debug')('ERROR:app');
const logWARN = require('debug')('WARN:app');
const logINFO = require('debug')('INFO:app');

const db = require('./lib/db/common.js');
const dbSeed = require('./lib/db/seed.js');
const auth = require('./lib/auth.js');
const dbUpgrade = require('./lib/db/upgrade');
const app = express();
module.exports = app;

db.init()
    .then(dbUpgrade.upgrade)
    .then(dbSeed.testSeed)
    .then(startAll)
    .catch(function(err) {
        logERR('Application failed to start: %s', err.message);
    });

function startAll(res) {
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(logger('tiny'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    // connect authentication to database
    auth.connect2DB(db.conn.model('User'), auth.passport);

    // configure nodejs session management
    app.use(
        session({ secret: '{secret}', name: 'session_id', saveUninitialized: true, resave: true })
    );

    // initialize passport authentication
    app.use(auth.passport.initialize());
    app.use(auth.passport.session());
    app.use(auth.flash());

    // configure routes
    require('./routes')(app);

    console.log('Application started.');
}
