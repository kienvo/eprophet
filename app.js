var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socketapi = require("./socketapi");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');
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
app.use('/user', usersRouter);
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
let db
client.connect().then((err, cl) => {
	db = client.db(dbname)
	app.set('db',db)
	console.log("database: connected!");
}).catch((error) => {
	console.error('database: connection failed!');
	console.error('shuting down server');
	throw error
})

io = socketapi.io
io.on('connection', (socket) => {
	console.log('Socket.io: a user connected');
	io.to(socket.id).emit('devData', {
		labels: [
			'0h01', '0h05', '0h10', '0h15', '0h20', '0h25',
			'0h30', '0h35', '0h40', '0h45', '0h50', '0h55'
		],
		datasets: [{
			label: 'Energy',
			data: [12, 15, 3, 5, 2, 3, 12, 15, 3, 5, 2, 3],
			borderWidth: 3
		}]
	});
});

module.exports = {app, socketapi};
