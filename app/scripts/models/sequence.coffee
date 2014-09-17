Model = require './model'

module.exports = class Sequence extends Model

  noteId = 0

  defaults:
    loopSize: 4
    notes: {}

  constructor: ->
    super
    @lastBeat = 0
    @bar = 0

  clonedNotes: ->
    clone = {}
    clone[k] = v for k, v of @state.notes
    clone

  clonedNote: (id) ->
    clone = {}
    clone[k] = v for k, v of @state.notes[id]
    clone

  addNote: (note) ->
    noteId += 1
    note.id = noteId
    notes = @clonedNotes()
    notes[noteId] = note
    @set {notes}

  addNotes: (additions) ->
    notes = @clonedNotes()
    for id, note of additions
      noteId += 1
      note.id = noteId
      notes[noteId] = note
    @set {notes}

  removeNote: (id) ->
    notes = @clonedNotes()
    delete notes[id]
    @set {notes}

  removeNotes: (ids) ->
    notes = @clonedNotes()
    delete notes[id] for id in ids
    @set {notes}

  updateNote: (id, attrs) ->
    note = @clonedNote id
    note[k] = v for k, v of attrs
    notes = @clonedNotes()
    notes[id] = note
    @set {notes}

  updateNotes: (changes) ->
    notes = @clonedNotes()
    for id, attrs of changes
      note = @clonedNote id
      note[k] = v for k, v of attrs
      notes[id] = note
    @set {notes}

  notesOn: (beat) ->
    notes = []
    bar = Math.floor beat / @state.loopSize
    beat = beat % @state.loopSize
    for id, note of @state.notes
      notes.push note if note.start < beat and (note.start >= @lastBeat or bar > @bar)
    @lastBeat = beat
    @bar = bar
    notes

  reset: ->
    @lastBeat = 0
    @lastBar = 0