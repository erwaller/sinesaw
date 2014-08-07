Model = require './model'
Sequence = require './sequence'

module.exports = class Track extends Model

  meterDecay = 0.0005

  defaults:
    name: 'Track'
    meterLevel: 0

  constructor: (@instrument, @state) ->
    super
    @sequence = new Sequence
    @effects = []
    @meterLevel = 0

  out: (time) ->
    sample = @effects.reduce((sample, e) ->
      e.out time, sample
    , @instrument.out time)

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