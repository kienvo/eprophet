var express = require('express');
var router = express.Router({ mergeParams: true });

router.get('/', function(req, res, next) {
	res.status(400).json({ message: "Please specify which chart to display"});
	next();
});

router.get('/consum', function(req, res, next) {
	res.render('charts/consum', {
		title: 'POWER CONSUMTION IN RECENT DATES',
		chart: {
			title: 'POWER CONSUMTION IN RECENT DATES'
		}, 

		consumChConfig: {
			predBaseUrl: 'http://rockwell.eproject.kienlab.com/api/consum-fc',
			devBaseUrl: 'http://rockwell.eproject.kienlab.com/api/consum',
			dev_id: req.params.dev_id,
			chartTitle: "POWER CONSUMTION IN RECENT DATES",
			dataLabel: 'Power Consumption (Wh)',
			xAxisKey: 'consumption', // data field
			yAxisKey: 'date', // time field
		}
	});
});

router.get('/power', function(req, res, next) {
	res.render('charts/power', {
		title: 'POWER',
		
		pwChConfig: {
			baseUrl: 'http://rockwell.eproject.kienlab.com/api/raw',
			dev_id: req.params.dev_id,
			devDataLen: 100,
			predDataLen: 100,
			dataLabel: 'Power (W)',
			yAxisKey: 'P', // data field
			xAxisKey: 'timestamp', // time field
			chartTitle: "POWER",
		}, 
	});
});

router.get('/stacked', function(req, res, next) {
	res.render('charts/stacked', {		
		pwChConfig: {
			baseUrl: 'http://rockwell.eproject.kienlab.com/api/raw',
			dev_id: req.params.dev_id,
			devDataLen: 100,
			predDataLen: 100,
			dataLabel: 'Power (W)',
			yAxisKey: 'P', // data field
			xAxisKey: 'timestamp', // time field
			chartTitle: "POWER",
		}, 
	});
});

module.exports = router;
