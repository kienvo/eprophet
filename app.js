var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socketapi = require("./socketapi");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chartRouter = require('./routes/chart');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chart', chartRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

// set db connection
const { MongoClient } = require("mongodb");
const dbname = 'prophet';
const client = new MongoClient('mongodb://localhost:27017');
client.connect().then((err, cl) => {
	app.set('db',client.db(dbname))
	console.log("database: connected!");
}).catch((error) => {
	console.error('database: connection failed!');
	console.error('shuting down server');
	throw error
})

module.exports = {app, socketapi};
