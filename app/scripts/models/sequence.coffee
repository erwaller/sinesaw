Model = require './model'


module.exports = class Sequence extends Model

  @defaults:
    loopSize: 4
    notes: {}
