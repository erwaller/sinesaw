Instrument = require './instrument'
RingBuffer = require '../util/ring_buffer'

module.exports = class LoopSampler extends Instrument

  defaults:
    level: 0.5
    polyphony: 1
    slices: []
