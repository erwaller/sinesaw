Model = require './model'
Sequence = require './sequence'

module.exports = class Track extends Model

  meterDecay = 0.0005

  defaults:
    name: 'Track'
    meterLevel: 0

  constructor: (state, @instrument) ->
    super
    @sequence = new Sequence
    @effects = []

  out: (time, i) ->
    sample = @effects.reduce((sample, e) ->
      e.out time, i, sample
    , @instrument.out time, i)

    if sample > @meterLevel
      @meterLevel = sample
    else if @meterLevel > 0
      @meterLevel -= meterDecay

    sample

  tick: (time, i, beat, bps) ->
    notesOn = @sequence.notesOn beat
    @instrument.tick time, i, beat, bps, notesOn
    @effects.forEach (e) -> e.tick time, beat, bps
    @set {@meterLevel}

  reset: ->
    @instrument.reset()
    effect.reset() for effect in @effects

  toJSON: ->
    result = {}
    result[k] = v for k, v of @state
    result.effects = @effects.map (e) -> e.toJSON()
    result.sequence = @sequence.toJSON()
    result.instrument = @instrument.toJSON()
    delete result.meterLevel
    result
