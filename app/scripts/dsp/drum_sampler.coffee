Instrument = require './instrument'
envelope = require './components/envelope'
linearInterpolator = require './components/linear_interpolator'


module.exports = class DrumSampler extends Instrument

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

  @tick: (state, instrument, time, i, beat, bps, notesOn, notesOff) ->
    @createState state, instrument unless state[instrument._id]?

    notesOff.forEach ({key}) ->
      state[instrument._id].notes[key]?.timeOff = time

    notesOn.forEach (note) =>
      state[instrument._id].notes[note.key] = {time, i}
