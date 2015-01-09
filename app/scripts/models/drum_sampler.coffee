Instrument = require './instrument'
envelope = require '../dsp/envelope'
linearInterpolator = require '../dsp/linear_interpolator'
logSample = require '../util/log_sample'

module.exports = class DrumSampler extends Instrument

  @defaults:
    _type: 'DrumSampler'
    level: 0.5
    pan: 0.5
    drums: [
      {
        name: 'Drum 1'
        sampleData: null
        sampleName: ''
        transpose: 0
        level: 1
        start: 0
        key: 0
        volumeEnv:
          a: 0
          d: 1
          s: 1
          r: 1
      }
    ]

  @defaultDrum: (drums) ->
    name: "Drum #{drums.length + 1}"
    sampleData: null
    sampleName: ''
    transpose: 0
    level: 1
    start: 0
    key: do =>
      key = 0
      key += 1 while drums.some (drum) -> drum.key == key
      key
    volumeEnv:
      a: 0
      d: 1
      s: 1
      r: 1

  # keep notes in a map {key: noteData} instead of to a ring buffer
  # this gives us one monphonic voice per drum
  @createState: (state, instrument) ->
    state[instrument._id] = notes: {}

  @sample: (state, instrument, time, i) ->
    return 0 if instrument.level is 0
    return 0 unless state[instrument._id]?

    # sum all active notes
    instrument.level * instrument.drums.reduce((memo, drum) =>
      return memo unless drum.sampleData?

      note = state[instrument._id].notes[drum.key]
      return memo unless note?

      samplesElapsed = i - note.i
      offset = Math.floor drum.start * drum.sampleData.length
      return memo if samplesElapsed + offset > drum.sampleData.length

      sample = linearInterpolator drum.sampleData, drum.transpose, samplesElapsed, offset
      memo + drum.level * envelope(drum.volumeEnv, note, time) * (sample or 0)
    , 0)

  @tick: (state, instrument, time, i, beat, bps, notesOn) ->
    @createState state, instrument unless state[instrument._id]?

    notesOn.forEach (note) =>
      state[instrument._id].notes[note.key] = {time, i, len: note.length / bps}
