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
    meterLevel: 0
    sequence: Sequence.build()
    effects: []

  # keep meter levels here - this will be a map trackId: level
  # this needs to stay outside the normal cursor structure for performance
  # reasons because levels are updated on every sample
  @meterLevels: {}

  @sample: (track, time, i) ->
    # get instrument output
    Instrument = instrumentTypes[track.instrument._type]
    sample = Instrument.sample track.instrument, time, i

    # apply effects
    sample = track.effects.reduce((sample, effect) ->
      Effect.sample effect, time, i, sample
    , sample)

    # update meter levels
    id = track._id
    if not @meterLevels[id]? or isNaN(@meterLevels[id]) or sample > @meterLevels[id]
      @meterLevels[id] = sample

    sample

  @tick: (track, time, i, beat, lastBeat, bps) ->
    Instrument = instrumentTypes[track.instrument._type]
    notesOn = Sequence.notesOn track.sequence, beat, lastBeat
    Instrument.tick track.instrument, time, i, beat, bps, notesOn
    track.effects.forEach (e) -> e.tick time, beat, bps
