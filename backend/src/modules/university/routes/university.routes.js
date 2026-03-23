'use strict';

const { Router } = require('express');
const ctrl       = require('../controller/university.controller');
const { validate, validateQuery } = require('../../../shared/validators/validate');
const {
  CreateUniversitySchema,
  UpdateUniversitySchema,
  UniversityQuerySchema,
} = require('../schema');

const router = Router();

router.get('/stats', ctrl.stats.bind(ctrl));

router.get('/', validateQuery(UniversityQuerySchema), ctrl.index.bind(ctrl));

router.get('/:id', ctrl.show.bind(ctrl));

router.post('/', validate(CreateUniversitySchema), ctrl.store.bind(ctrl));

router.put('/:id', validate(UpdateUniversitySchema), ctrl.update.bind(ctrl));

router.patch('/:id', validate(UpdateUniversitySchema), ctrl.update.bind(ctrl));

router.delete('/:id', ctrl.destroy.bind(ctrl));

module.exports = router;
