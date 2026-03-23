'use strict';

const { Router } = require('express');
const ctrl       = require('../controller/scraper.controller');

const router = Router();

router.post('/all', ctrl.triggerAll.bind(ctrl));

router.post('/:id', ctrl.triggerOne.bind(ctrl));

module.exports = router;
