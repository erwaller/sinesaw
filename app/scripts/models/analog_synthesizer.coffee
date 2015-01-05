Instrument = require './instrument'
RingBuffer = require '../util/ring_buffer'
lowpassFilter = require '../dsp/lowpass_filter'
highpassFilter = require '../dsp/highpass_filter'
envelope = require '../dsp/envelope'
oscillators = require '../dsp/oscillators'

module.exports = class AnalogSynthesizer extends Instrument

  @defaults:
    _type: 'AnalogSynthesizer'
    level: 0.5
    pan: 0.5
    polyphony: 3
    maxPolyphony: 6
    volumeEnv:
      a: 0
      d: 0.25
      s: 0
      r: 0.5
    filterEnv:
      a: 0
      d: 0.25
      s: 0.2
      r: 0.5
    filter:
      type: 'LP'
      freq: 0.27
      res: 0.05
      env: 0.45
    osc1:
      waveform: 'saw'
      level: 0.5
      pitch: 0.5
      tune: 0.5
    osc2:
      waveform: 'saw'
      level: 0.5
      pitch: 0.5
      tune: 0.5

  @createState: (instrument) ->
    super instrument

    @state[instrument._id].filters =
      LP: (lowpassFilter() for i in [0...instrument.maxPolyphony])
      HP: (highpassFilter() for i in [0...instrument.maxPolyphony])
      none: (((sample) -> sample) for i in [0...instrument.maxPolyphony])

  tune = 440
  frequency = (key) ->
    tune * Math.pow 2, (key - 69) / 12

  @out: (instrument, time, i) ->
    return 0 if @state.level == 0
    return 0 unless @state[instrument._id]?

    # sum all active notes
    r = Math.max 0.01, instrument.volumeEnv.r
    instrument.level * @state[instrument._id].notes.reduce((memo, note, index) =>
      return memo unless note?
      return memo unless note.len + r > time - note.time

      # sum oscillators and apply volume envelope
      osc1Freq = frequency note.key + instrument.osc1.tune - 0.5 + Math.round(24 * (instrument.osc1.pitch - 0.5))
      osc2Freq = frequency note.key + instrument.osc2.tune - 0.5 + Math.round(24 * (instrument.osc2.pitch - 0.5))
      sample = envelope(instrument.volumeEnv, note, time) * (
        instrument.osc1.level * oscillators[instrument.osc1.waveform](time, osc1Freq) +
        instrument.osc2.level * oscillators[instrument.osc2.waveform](time, osc2Freq)
      )

      # apply filter with envelope
      cutoff = Math.min 1, instrument.filter.freq + instrument.filter.env * envelope(instrument.filterEnv, note, time)
      filter = @state[instrument._id].filters[instrument.filter.type][index]
      sample = filter sample, cutoff, instrument.filter.res

      # return result
      memo + sample

    , 0)
