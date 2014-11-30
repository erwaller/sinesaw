Model = require './model'
Sequence = require './sequence'

instrumentTypes =
  AnalogSynthesizer: require './analog_synthesizer'
  BasicSampler: require './basic_sampler'
  DrumSampler: require './drum_sampler'
  DrumkitSynthesizer: require './drumkit_synthesizer'
  LoopSampler: require './loop_sampler'


module.exports = class Track extends Model

  meterDecay = 0.0005

  @defaults:
    name: 'Track'
    meterLevel: 0
    sequence: Sequence.build()
    effects: []

  @meterLevels: {}

  @out: (track, time, i) ->
    sample = Instrument.out track.instrument, time, i

    sample = track.effects.reduce((sample, effect) ->
      Effect.out effect, time, i, sample
    , sample)

    if sample > track.meterLevel
      @meterLevels[track._id] = sample
    else if track.meterLevel > 0
      @meterLevels[track._id] -= meterDecay

    sample

  @tick: (track, time, i, beat, lastBeat, bps) ->
    notesOn = Sequence.notesOn track.sequence, beat, lastBeat
    Instrument.tick track.instrument, time, i, beat, bps, notesOn
    @effects.forEach (e) -> e.tick time, beat, bps
    @set {@meterLevel}
