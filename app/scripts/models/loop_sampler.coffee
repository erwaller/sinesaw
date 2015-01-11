Model = require './model'


module.exports = class LoopSampler extends Model

  defaults:
    level: 0.5
    polyphony: 1
    slices: []
