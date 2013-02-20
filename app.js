
/**
 * Module dependencies.
 */

var express = require('express'),
engine = require('ejs-locals'),
routes = require('./routes'),
http = require('http'),
flash = require('connect-flash'),
path = require('path');

var app = express();

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);

var MongoStore = require('connect-mongo')(express),
settings = require('./settings');

var fs = require('fs');
var accessLogfile = fs.createWriteStream('access.log', {flag: 'a'});
var errorLogfile = fs.createWriteStream('error.log', {flag: 'a'});

app.configure(function() {
    app.use(express.logger({stream: accessLogfile}));
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(flash());
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: settings.cookieSecret,
        store: new MongoStore({
            db: settings.db
        }, function() {
            console.log('connect mongodb success...');
        })
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function(req, res, next) {
        res.locals.user = req.session.user;

        var err = req.flash('error').toString();
        if (err.length)
            res.locals.error = err;
        else
            res.locals.error = null;
        var succ = req.flash('success').toString();
        console.log(succ);
        if (succ.length)
            res.locals.success = succ;
        else
            res.locals.success = null;
        next();
    });
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.configure('production', function() {
    app.error(function(err, req, res, next) {
        var meta = '[' + new Date() + ']' + req.url + '\n';
        errorLogfile.write(meta + err.stack + '\n');
        next();
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

routes(app);
