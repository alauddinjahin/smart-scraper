class BaseStrategy {
  constructor(ctx) {
    this.ctx = ctx;
    this.http = ctx.http;
    this.randomUA = ctx.randomUA;
  }
}

module.exports = BaseStrategy