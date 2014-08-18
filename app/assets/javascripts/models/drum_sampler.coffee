Model = require './model'

module.exports = class DrumSampler extends Model

  defaults:
    level: 0.5
    pan: 0.5
    drums: []

  defaultDrum: ->
    name: "Drum #{@state.drums.length + 1}"
    sampleData: null
    sampleName: ''
    volumeEnv:
      a: 0
      d: 1
      s: 0.5
      r: 0.5

  constructor: ->
    super
    @notes = {}

  reset: ->
    @notes = {}

  createSetterForDrum: (index) ->
    (value) =>
      @set drums: @state.drums.map (drum, i) ->
        if i == index then value else drum

  addDrum: =>
    drums = @state.drums.slice(0)
    drums.push @defaultDrum()
    @set {drums}

  removeDrum: (index) =>
    drums = @state.drums.slice(0)
    drums.splice index, 1
    @set {drums}

  out: ->

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes[note.key] = time if @state.drums[note.key]?
