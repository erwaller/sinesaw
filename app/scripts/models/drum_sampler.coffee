Instrument = require './instrument'
envelope = require '../dsp/envelope'
linearInterpolator = require '../dsp/linear_interpolator'

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

  # defaultDrum: ->
  #   name: "Drum #{@state.drums.length + 1}"
  #   sampleData: null
  #   sampleName: ''
  #   transpose: 0
  #   level: 1
  #   start: 0
  #   key: do =>
  #     key = 0
  #     key += 1 while @state.drums.some (drum) -> drum.key == key
  #     key
  #   volumeEnv:
  #     a: 0
  #     d: 1
  #     s: 1
  #     r: 1

  # constructor: ->
  #   super
  #   @notes = {}

  # reset: ->
  #   @notes = {}

  # createSetterForDrum: (index) ->
  #   (value) =>
  #     @set drums: @state.drums.map (drum, i) ->
  #       if i == index then value else drum

  # addDrum: =>
  #   drums = @state.drums.slice(0)
  #   drums.push @defaultDrum()
  #   @set {drums}

  # removeDrum: (index) =>
  #   drums = @state.drums.slice(0)
  #   drums.splice index, 1
  #   @set {drums}

  # out: (time, i) =>
  #   return 0 if @state.level == 0

  #   # sum all active notes
  #   @state.level * @state.drums.reduce((memo, drum) =>
  #     return memo unless drum.sampleData?

  #     note = @notes[drum.key]
  #     return memo unless note?

  #     samplesElapsed = i - note.i
  #     offset = Math.floor drum.start * drum.sampleData.length
  #     return memo if samplesElapsed + offset > drum.sampleData.length

  #     sample = linearInterpolator drum.sampleData, drum.transpose, samplesElapsed, offset
  #     memo + drum.level * envelope(drum.volumeEnv, note, time) * (sample or 0)
  #   , 0)

  # tick: (time, i, beat, bps, notesOn) =>
  #   # add new notes
  #   notesOn.forEach (note) =>
  #     @notes[note.key] = {time, i, len: note.length / bps}
