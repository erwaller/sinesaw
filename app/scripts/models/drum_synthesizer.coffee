Instrument = require './instrument'
highpassFilter = require '../dsp/highpass_filter'
simpleEnvelope = require '../dsp/simple_envelope'
oscillators = require '../dsp/oscillators'
logSample = require '../util/log_sample'
cuid = require 'cuid'


module.exports = class DrumSynthesizer extends Instrument

  minFreq = 60
  maxFreq = 3000
  freqScale = maxFreq - minFreq

  @defaults:
    _type: 'DrumSynthesizer'
    level: 0.5
    pan: 0.5
    drums: [
      {
        key: 0
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
        key: 1
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
        key: 2
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
        key: 3
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

  @defaultDrum: (drums) ->
    key: do =>
      key = 0
      key += 1 while drums.some (drum) -> drum.key == key
      key
    name: "Drum #{drums.length + 1}"
    level: 0.5
    hp: 0
    decay: 0.5
    noise: 0.5
    pitch: 0.5
    bend: 0
    fm: 0
    fmDecay: 0
    fmFreq: 0

  # keep notes in a map {key: noteData} instead of to a ring buffer
  # this gives us one monphonic voice per drum.
  @createState: (state, instrument) ->
    state[instrument._id] =
      notes: {}
      filters: (
        highpassFilter() for i in [0...127]
      )

  @sample: (state, instrument, time, i) ->
    return 0 if instrument.level is 0
    return 0 unless state[instrument._id]?

    # sum all active notes
    instrument.level * instrument.drums.reduce((memo, drum) =>
      note = state[instrument._id].notes[drum.key]
      return memo unless note?

      elapsed = time - note.time
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
        sample = state[instrument._id].filters[drum.key] sample, drum.hp

      memo + drum.level * env * sample

    , 0)


  @tick: (state, instrument, time, i, beat, bps, notesOn) ->
    @createState state, instrument unless state[instrument._id]?

    notesOn.forEach (note) =>
      state[instrument._id].notes[note.key] = {time, i, len: note.length / bps}

