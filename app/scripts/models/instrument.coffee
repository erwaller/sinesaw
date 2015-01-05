Model = require './model'
RingBuffer = require '../util/ring_buffer'

module.exports = class Instrument extends Model

  @state: {}

  @createState: (instrument) ->
    @state[instrument._id] =
      notes: new RingBuffer instrument.maxPolyphony, Array, instrument.polyphony

  @releaseState: (instrument) ->
    delete @state[instrument._id]

  @sample: (instrument, time, i) ->
    0

  @tick: (instrument, time, i, beat, bps, notesOn) ->
    @createState instrument unless @state[instrument._id]?
    state = @state[instrument._id]

    if instrument.polyphony != state.notes.length
      state.notes.resize instrument.polyphony

    notesOn.forEach (note) =>
      state.notes.push {time, i, key: note.key, len: note.length / bps}
