Model = require './model'
RingBuffer = require '../util/ring_buffer'
lowpassFilter = require '../dsp/lowpass_filter'
highpassFilter = require '../dsp/highpass_filter'
envelope = require '../dsp/envelope'
oscillators = require '../dsp/oscillators'

module.exports = class AnalogSynthesizer extends Model

  tune = 440
  frequency = (key) ->
    tune * Math.pow 2, (key - 69) / 12

  maxPolyphony: 6

  defaults:
    level: 0.5
    pan: 0.5
    polyphony: 3
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

  constructor: ->
    super
    @notes = new RingBuffer @maxPolyphony, Array, @state.polyphony
    @filters =
      LP: (lowpassFilter() for i in [0...@maxPolyphony])
      HP: (highpassFilter() for i in [0...@maxPolyphony])
      none: (((sample) -> sample) for i in [0...@maxPolyphony])

  setPolyphony: (polyphony) ->
    @notes.resize polyphony
    @set {polyphony}

  reset: ->
    @notes.reset()

  out: (time) =>
    return 0 if @state.level == 0

    # sum all active notes
    r = Math.max 0.01, @state.volumeEnv.r
    @state.level * @notes.reduce((memo, note, index) =>
      return memo unless note?
      return memo unless note.len + r > time - note.time

      # sum oscillators and apply volume envelope
      osc1Freq = frequency note.key + @state.osc1.tune - 0.5 + Math.round(24 * (@state.osc1.pitch - 0.5))
      osc2Freq = frequency note.key + @state.osc2.tune - 0.5 + Math.round(24 * (@state.osc2.pitch - 0.5))
      sample = envelope(@state.volumeEnv, note, time) * (
        @state.osc1.level * oscillators[@state.osc1.waveform](time, osc1Freq) +
        @state.osc2.level * oscillators[@state.osc2.waveform](time, osc2Freq)
      )

      # apply filter with envelope
      filterCutoff = Math.min 1, @state.filter.freq + @state.filter.env * envelope(@state.filterEnv, note, time)
      sample = @filters[@state.filter.type][index] sample, filterCutoff, @state.filter.res

      # return result
      memo + sample

    , 0)

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes.push {time, key: note.key, len: note.length / bps}

