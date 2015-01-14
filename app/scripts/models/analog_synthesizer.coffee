Model = require './model'


module.exports = class AnalogSynthesizer extends Model

  @defaults:
    _type: 'AnalogSynthesizer'
    level: 0.5
    pan: 0.5
    polyphony: 3
    maxPolyphony: 6
    volumeEnv:
      a: 0
      d: 0.25
      s: 0.5
      r: 0.5
    filterEnv:
      a: 0
      d: 0.25
      s: 0.5
      r: 0.5
    filter:
      type: 'LP'
      freq: 0.27
      res: 0.05
      env: 0.45
    osc1:
      waveform: 'saw'
      level: 0.5
      pitch: 0.5
      tune: 0.5
    osc2:
      waveform: 'saw'
      level: 0.5
      pitch: 0.5
      tune: 0.5
