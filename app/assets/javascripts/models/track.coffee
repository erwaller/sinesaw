class @Track

  constructor: ->
    @instrument = new AnalogSynthesizer
    @sequence = new Sequence
    @effects = []

  out: (time) ->
    @effects.reduce((sample, e) ->
      e.out time, sample
    , @instrument.out time)

  tick: (time, beat, bps) ->
    notesOn = @sequence.notesOn beat
    @instrument.tick time, beat, bps, notesOn
    @effects.forEach (e) -> e.tick time, beat, bps

  reset: ->
    @instrument.reset()
    effect.reset() for effect in @effects