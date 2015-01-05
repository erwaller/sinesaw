Instrument = require './instrument'
RingBuffer = require '../util/ring_buffer'
linearInterpolator = require '../dsp/linear_interpolator'
lowpassFilter = require '../dsp/lowpass_filter'
highpassFilter = require '../dsp/highpass_filter'
envelope = require '../dsp/envelope'
logSample = require '../util/log_sample'

module.exports = class BasicSampler extends Instrument

  @defaults:
    _type: 'BasicSampler'
    level: 0.5
    pan: 0.5
    polyphony: 1
    maxPolyphony: 6
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

  @createState: (instrument) ->
    super instrument

    @state[instrument._id].filters =
      LP: (lowpassFilter() for i in [0...instrument.maxPolyphony])
      HP: (highpassFilter() for i in [0...instrument.maxPolyphony])
      none: (((sample) -> sample) for i in [0...instrument.maxPolyphony])

  @out: (instrument, time, i) ->
    return 0 if instrument.level == 0
    return 0 unless @state[instrument._id]?
    return 0 unless instrument.sampleData?

    r = Math.max 0.01, instrument.volumeEnv.r

    instrument.level * @state[instrument._id].notes.reduce((memo, note, index) =>
      return memo unless note?
      return memo unless note.len + r > time - note.time

      # get pitch shifted interpolated sample and apply volume envelope
      transpose = note.key - instrument.rootKey + instrument.tune - 0.5
      samplesElapsed = i - note.i
      offset = Math.floor instrument.start * instrument.sampleData.length
      loopPoint = Math.floor instrument.loop * instrument.sampleData.length
      sample = linearInterpolator instrument.sampleData, transpose, samplesElapsed, offset, instrument.loopActive == 'loop', loopPoint
      sample = envelope(instrument.volumeEnv, note, time) * (sample or 0)

      # apply filter with envelope
      cutoff = Math.min 1, instrument.filter.freq + instrument.filter.env * envelope(instrument.filterEnv, note, time)
      filter = @state[instrument._id].filters[instrument.filter.type][index]
      sample = filter sample, cutoff, instrument.filter.res

      # return result
      memo + sample

    , 0)
