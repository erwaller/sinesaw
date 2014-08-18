Model = require './model'
RingBuffer = require '../util/ring_buffer'
envelope = require '../dsp/envelope'
linearInterpolator = require '../dsp/linear_interpolator'

module.exports = class BasicSampler extends Model

  maxPolyphony: 6

  defaults:
    level: 0.5
    pan: 0.5
    polyphony: 1
    rootKey: 60
    sampleData: null
    sampleName: ''
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

  constructor: ->
    super
    @notes = new RingBuffer @maxPolyphony, Array, @state.polyphony

  setPolyphony: (polyphony) ->
    @notes.resize polyphony
    @set {polyphony}

  reset: ->
    @notes.reset()

  out: (time, i) =>
    return 0 if @state.level == 0
    return 0 unless @state.sampleData?

    r = Math.max 0.01, @state.volumeEnv.r
    @state.level * @notes.reduce((memo, note, index) =>
      return memo unless note?
      return memo unless note.len + r > time - note.time

      transpose = note.key - @state.rootKey
      samplesElapsed = i - note.i
      sample = linearInterpolator @state.sampleData, transpose, samplesElapsed

      memo + envelope(@state.volumeEnv, note, time) * (sample or 0)
    , 0)

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes.push {time, i, key: note.key, len: note.length / bps}
