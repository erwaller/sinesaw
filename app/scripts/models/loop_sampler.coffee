Model = require './model'
RingBuffer = require '../util/ring_buffer'

module.exports = class LoopSampler extends Model

  maxPolyphony: 6

  defaults:
    level: 0.5
    polyphony: 1
    slices: []

  constructor: ->
    super
    @notes = new RingBuffer @maxPolyphony, Array, @state.polyphony

  setPolyphony: (polyphony) ->
    @notes.resize polyphony
    @set {polyphony}

  out: ->
    0

  tick: ->

  reset: ->
