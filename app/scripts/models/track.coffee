Model = require './model'
Sequence = require './sequence'
logSample = require '../util/log_sample'

instrumentTypes =
  AnalogSynthesizer: require './analog_synthesizer'
  BasicSampler: require './basic_sampler'
  DrumSampler: require './drum_sampler'
  DrumSynthesizer: require './drum_synthesizer'
  LoopSampler: require './loop_sampler'


module.exports = class Track extends Model

  @defaults: ->
    name: 'Track'
    sequence: Sequence.build()
    effects: []

  @createState: (state, track) ->
    state[track._id] =
      meterLevel: 0

  @releaseState: (state, track) ->
    delete state[track._id]

  @sample: (state, track, time, i) ->
    # get instrument output
    Instrument = instrumentTypes[track.instrument._type]
    sample = Instrument.sample state, track.instrument, time, i

    # apply effects
    sample = track.effects.reduce((sample, effect) ->
      Effect.sample state, effect, time, i, sample
    , sample)

    # update meter levels
    if trackState = state[track._id]
      level = trackState.meterLevel
      if not level? or isNaN(level) or sample > level
        trackState.meterLevel = sample

    sample

  @tick: (state, track, time, i, beat, lastBeat, bps) ->
    @createState state, track unless state[track._id]?

    Instrument = instrumentTypes[track.instrument._type]
    notesOn = Sequence.notesOn track.sequence, beat, lastBeat
    Instrument.tick state, track.instrument, time, i, beat, bps, notesOn
    track.effects.forEach (e) -> e.tick state, time, beat, bps
