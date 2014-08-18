Model = require './model'
envelope = require '../dsp/envelope'
linearInterpolator = require '../dsp/linear_interpolator'

module.exports = class DrumSampler extends Model

  defaults:
    level: 0.5
    pan: 0.5
    drums: [
      {
        name: 'Drum 1'
        sampleData: null
        sampleName: ''
        transpose: 0
        volumeEnv:
          a: 0
          d: 1
          s: 0.5
          r: 0.5
      }
    ]

  defaultDrum: ->
    name: "Drum #{@state.drums.length + 1}"
    sampleData: null
    sampleName: ''
    transpose: 0
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

  out: (time, i) =>
    return 0 if @state.level == 0

    # sum all active notes
    @state.level * @state.drums.reduce((memo, drum, index) =>
      return memo unless @notes[index]?
      samplesElapsed = i - @notes[index].i
      return memo if samplesElapsed > drum.sampleData.length

      sample = linearInterpolator drum.sampleData, drum.transpose, samplesElapsed
      memo + envelope(drum.volumeEnv, @notes[index], time) * (sample or 0)
    , 0)

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes[note.key] = {time, i, len: note.length / bps}
