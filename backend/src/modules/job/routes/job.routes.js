'use strict';

const { Router } = require('express');
const ctrl       = require('../controller/job.controller');

const router = Router();

router.get('/', ctrl.index.bind(ctrl));

router.get('/:jobId', ctrl.show.bind(ctrl));

module.exports = router;
