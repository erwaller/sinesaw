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

  @out: (data, time, i) ->
    sample = data.effects.reduce((sample, effect) ->
      Effect.out effect, time, i, sample
    , @instrument.out time, i)

    if sample > @meterLevel
      @meterLevel = sample
    else if @meterLevel > 0
      @meterLevel -= meterDecay

    sample

  @tick: (data, time, i, beat, bps) ->
    notesOn = @sequence.notesOn beat
    @instrument.tick time, i, beat, bps, notesOn
    @effects.forEach (e) -> e.tick time, beat, bps
    @set {@meterLevel}
