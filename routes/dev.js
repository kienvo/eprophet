var express = require('express');
var router = express.Router();

router.use('/:dev_id/chart', require('./chart'));
router.use('/:dev_id/dashboard', require('./dashboard'));

module.exports = router;
