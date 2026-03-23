'use strict';

const { z } = require('zod');

const validate      = schema => (req, _res, next) => { req.body  = schema.parse(req.body);  next(); };
const validateQuery = schema => (req, _res, next) => { req.query = schema.parse(req.query); next(); };

module.exports = { validate, validateQuery };
