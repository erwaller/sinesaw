Immutable = require 'immutable'
Model = require './model'
highpassFilter = require '../dsp/highpass_filter'
simpleEnvelope = require '../dsp/simple_envelope'
oscillators = require '../dsp/oscillators'
logSample = require '../util/log_sample'

module.exports = class DrumkitSynthesizer extends Model

  minFreq = 60
  maxFreq = 3000
  freqScale = maxFreq - minFreq

  drumId = 0

  defaults:
    level: 0.5
    pan: 0.5
    drums: [
      {
        id: drumId += 1
        name: 'Kick'
        level: 1
        hp: 0
        decay: 0.35
        noise: 0.001
        pitch: 0
        bend: 0.39
        fm: 1
        fmDecay: 0.05
        fmFreq: 0.02
      }, {
        id: drumId += 1
        name: 'Snare'
        level: 0.5
        hp: 0.22
        decay: 0.1
        noise: 0.8
        pitch: 0.1
        bend: 0
        fm: 0
        fmDecay: 0
        fmFreq: 0
      }, {
        id: drumId += 1
        name: 'HH1'
        level: 0.05
        hp: 1
        decay: 0.07
        noise: 0.8
        pitch: 0.4
        bend: 0
        fm: 1
        fmDecay: 0.4
        fmFreq: 0
      }, {
        id: drumId += 1
        name: 'HH2'
        level: 0.2
        hp: 0.6
        decay: 0.22
        noise: 1
        pitch: 0.5
        bend: 0
        fm: 0
        fmDecay: 0
        fmFreq: 0
      }
    ]

  defaultDrum: ->
    id: drumId += 1
    name: "Drum #{@state.drums.length + 1}"
    level: 0.5
    hp: 0
    decay: 0.5
    noise: 0.5
    pitch: 0.5
    bend: 0
    fm: 0
    fmDecay: 0
    fmFreq: 0

  constructor: ->
    super
    @notes = {}
    @filters = {}
    @updateFilters()

  reset: ->
    @notes = {}

  updateFilters: ->
    @filters = @state.drums.reduce((memo, drum) =>
      memo[drum.id] = @filters[drum.id] or highpassFilter()
      memo
    , {})

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

  out: (time) ->
    return 0 if @state.level == 0

    # sum all active notes
    @state.level * @state.drums.reduce((memo, drum, index) =>
      return memo unless @notes[index]?
      elapsed = time - @notes[index]
      return memo if elapsed > drum.decay

      env = simpleEnvelope drum.decay, elapsed
      freq = minFreq + drum.pitch * freqScale

      # apply pitch bend
      if drum.bend
        freq = (2 - drum.bend + drum.bend * env) / 2 * freq

      # apply fm
      if drum.fm > 0
        signal = oscillators.sine elapsed, minFreq + drum.fmFreq * freqScale
        freq += drum.fm * signal * simpleEnvelope(drum.fmDecay + 0.01, elapsed) 

      # sum noise and oscillator
      sample = (
        (1 - drum.noise) * oscillators.sine(elapsed, freq) +
        drum.noise * oscillators.noise()
      )

      # apply highpass
      if drum.hp > 0
        sample = @filters[index] sample, drum.hp

      memo + drum.level * env * sample
    
    , 0)

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes[note.key] = time if @state.drums[note.key]?
