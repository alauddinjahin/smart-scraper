'use strict';

const { HTTP_STATUS } = require("./constants");

const respond = {
  ok:      (res, data, meta = {})  => res.status(HTTP_STATUS.OK).json({ success: true,  data, ...meta }),
  created: (res, data)             => res.status(HTTP_STATUS.CREATED).json({ success: true,  data }),
  noContent: (res)                 => res.status(HTTP_STATUS.NOCONTENT).send(),
  accepted: (res, data)            => res.status(HTTP_STATUS.ACCEPTED).json({ success: true,  data }),
  paginated: (res, data, total, page, limit) =>
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    }),
};

module.exports = respond;
