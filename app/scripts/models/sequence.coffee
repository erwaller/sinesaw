Model = require './model'

module.exports = class Sequence extends Model

  @defaults:
    loopSize: 4
    notes: {}

  @notesOn: (sequence, beat, lastBeat) ->
    bar = Math.floor beat / sequence.loopSize
    lastBar = Math.floor lastBeat / sequence.loopSize
    beat = beat % sequence.loopSize
    lastbeat = lastBeat % sequence.loopSize

    sequence.notes.filter (note) ->
      note.start < beat and (note.start >= lastBeat or bar > lastBar)
