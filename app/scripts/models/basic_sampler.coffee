Instrument = require './instrument'
RingBuffer = require '../util/ring_buffer'
linearInterpolator = require '../dsp/linear_interpolator'
lowpassFilter = require '../dsp/lowpass_filter'
highpassFilter = require '../dsp/highpass_filter'
envelope = require '../dsp/envelope'


module.exports = class BasicSampler extends Instrument

  @defaults:
    _type: 'BasicSampler'
    level: 0.5
    pan: 0.5
    polyphony: 1
    rootKey: 60
    sampleData: null
    sampleName: ''
    start: 0.3
    loopActive: 'loop'
    loop: 0.7
    tune: 0.5
    volumeEnv:
      a: 0
      d: 0.25
      s: 1
      r: 0.5
    filterEnv:
      a: 0
      d: 0.25
      s: 1
      r: 0.5
    filter:
      type: 'none'
      freq: 0.27
      res: 0.05
      env: 0.45

  # constructor: ->
  #   super
  #   @notes = new RingBuffer @maxPolyphony, Array, @state.polyphony
  #   @filters =
  #     LP: (lowpassFilter() for i in [0...@maxPolyphony])
  #     HP: (highpassFilter() for i in [0...@maxPolyphony])
  #     none: (((sample) -> sample) for i in [0...@maxPolyphony])

  # setPolyphony: (polyphony) ->
  #   @notes.resize polyphony
  #   @set {polyphony}

  # reset: ->
  #   @notes.reset()

  # out: (time, i) =>
  #   return 0 if @state.level == 0
  #   return 0 unless @state.sampleData?

  #   r = Math.max 0.01, @state.volumeEnv.r
  #   @state.level * @notes.reduce((memo, note, index) =>
  #     return memo unless note?
  #     return memo unless note.len + r > time - note.time

  #     # get pitch shifted interpolated sample and apply volume envelope
  #     transpose = note.key - @state.rootKey + @state.tune - 0.5
  #     samplesElapsed = i - note.i
  #     offset = Math.floor @state.start * @state.sampleData.length
  #     loopPoint = Math.floor @state.loop * @state.sampleData.length
  #     sample = linearInterpolator @state.sampleData, transpose, samplesElapsed, offset, @state.loopActive == 'loop', loopPoint
  #     sample = envelope(@state.volumeEnv, note, time) * (sample or 0)

  #     # apply filter with envelope
  #     filterCutoff = Math.min 1, @state.filter.freq + @state.filter.env * envelope(@state.filterEnv, note, time)
  #     sample = @filters[@state.filter.type][index] sample, filterCutoff, @state.filter.res

  #     # return result
  #     memo + sample

  #   , 0)

  # tick: (time, i, beat, bps, notesOn) =>
  #   # add new notes
  #   notesOn.forEach (note) =>
  #     @notes.push {time, i, key: note.key, len: note.length / bps}
