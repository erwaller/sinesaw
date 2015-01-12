RingBuffer = require './components/ring_buffer'


module.exports = class Instrument

  @createState: (state, instrument) ->
    state[instrument._id] =
      notes: new RingBuffer instrument.maxPolyphony, Array, instrument.polyphony

  @releaseState: (state, instrument) ->
    delete state[instrument._id]

  @sample: (state, instrument, time, i) ->
    0

  @tick: (state, instrument, time, i, beat, bps, notesOn, notesOff) ->
    @createState state, instrument unless state[instrument._id]?
    instrumentState = state[instrument._id]

    if instrument.polyphony != instrumentState.notes.length
      instrumentState.notes.resize instrument.polyphony

    notesOn.forEach (note) =>
      instrumentState.notes.push(
        {time, i, key: note.key, len: note.length / bps}
      )
