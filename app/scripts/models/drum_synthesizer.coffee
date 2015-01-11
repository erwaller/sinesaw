Model = require './model'


module.exports = class DrumSynthesizer extends Model

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
