var express = require('express');
var router = express.Router();

var hash = require('pbkdf2-password')()
var path = require('path');
var session = require('express-session');

router.use(session({
	resave: false, // don't save session if unmodified
	saveUninitialized: false, // don't create session until something stored
	secret: 'shhhh, very secret'
}));

router.use(function(req, res, next){
	var err = req.session.error;
	var msg = req.session.success;
	delete req.session.error;
	delete req.session.success;
	res.locals.message = '';
	if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
	if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
	next();
});

const restrict = (req, res, next) => {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied!';
		res.redirect('/user/login');
	}
}

router.use('/:username/dev', restrict, 
(req, res, next) => {
	req.user = {
		username: req.params.username
	}
	next();
}
, require('./dev'));

router.get('/', restrict,function(req, res, next) {
	res.redirect('/user/diennhung/dev/D4:8A:FC:A5:ED:E0/dashboard'); // TODO: change this to dynamic
});

// dummy database
var users = {
	diennhung: { name: 'diennhung' }
};

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
	if (err) throw err;
	// store the salt & hash in the "db"
	users.diennhung.salt = salt;
	users.diennhung.hash = hash;
});

function authenticate(name, pass, fn) {
	if (!module.parent) console.log('authenticating %s:%s', name, pass);

	var user = users[name];// query the db for the given username
	
	if (!user) return fn(null, null)

	hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
		if (err) return fn(err);
		if (hash === user.hash) return fn(null, user)
		fn(null, null)
	});
}

router.get('/login', function(req, res) {
	res.render('user/login');
});

router.post('/login', function (req, res, next) {
	authenticate(req.body.username, req.body.password, function(err, user){
		if (err) return next(err)
		if (user) {
			// Regenerate session when signing in
			// to prevent fixation
			req.session.regenerate(function(){
				// Store the user's primary key
				// in the session store to be retrieved,
				// or in this case the entire user object
				req.session.user = user;
				req.session.success = 'Authenticated as ' + user.name
					+ ' click to <a href="/logout">logout</a>. '
					+ ' You may now access <a href="/restricted">/restricted</a>.';
				
				res.redirect('/user/diennhung/dev/D4:8A:FC:A5:ED:E0/dashboard'); // TODO: change this to dynamic
			});
		} else {
			req.session.error = 'Authentication failed, please check your '
			+ ' username and password.'
			+ ' (use "diennhung" and "foobar")';
			res.redirect('/user/login');
		}
	});
});

router.get('/logout', function(req, res){
	// destroy the user's session to log them out
	// will be re-created next request
	req.session.destroy(function(){
		res.redirect('/');
	});
});

module.exports = router;
