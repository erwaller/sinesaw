async = require 'async'
fs = require 'fs'
b2a = require 'base64-arraybuffer'
cuid = require 'cuid'
decoder = new webkitAudioContext

bass = b2a.decode fs.readFileSync "#{__dirname}/../audio/bass.wav", 'base64'
kick = b2a.decode fs.readFileSync "#{__dirname}/../audio/kick.wav", 'base64'
snare = b2a.decode fs.readFileSync "#{__dirname}/../audio/snare.wav", 'base64'
hat = b2a.decode fs.readFileSync "#{__dirname}/../audio/hat.wav", 'base64'


loaded = false
data = null
callbacks = []


module.exports = (cb) ->
  if loaded
    cb data
  else
    callbacks.push cb


# load sample data
async.parallel
  bass: (cb) -> decoder.decodeAudioData bass, (buffer) -> cb null, buffer
  kick: (cb) -> decoder.decodeAudioData kick, (buffer) -> cb null, buffer
  snare: (cb) -> decoder.decodeAudioData snare, (buffer) -> cb null, buffer
  hat: (cb) -> decoder.decodeAudioData hat, (buffer) -> cb null, buffer

  (err, results) ->

    data =
      _id: cuid()
      bpm: 120
      playing: false
      recording: false
      position: 0
      tracks: [
        {
          _id: cuid()
          name: 'Basic Sampler'
          meterLevel: 0
          sequence:
            _id: cuid()
            loopSize: 4
            notes: {}
          instrument:
            _id: cuid()
            _type: 'BasicSampler'
            level: 0.5
            pan: 0.5
            polyphony: 1
            rootKey: 60
            sampleData: results.bass.getChannelData 0
            sampleName: 'bass.wav'
            start: 0.3
            loopActive: 'loop'
            loop: 0.7
            tune: 0.5
            volumeEnv:
              a: 0
              d: 0.25
              s: 1
              r: 0.5
            filterEnv:
              a: 0
              d: 0.25
              s: 1
              r: 0.5
            filter:
              type: 'none'
              freq: 0.27
              res: 0.05
              env: 0.45
        }, {
          _id: cuid()
          name: 'Drum Sampler'
          meterLevel: 0
          sequence:
            _id: cuid()
            loopSize: 4
            notes: {}
          instrument:
            _id: cuid()
            _type: 'DrumSampler'
            level: 0.5
            pan: 0.5
            drums: [
              {
                name: 'Kick'
                sampleData: results.kick.getChannelData 0
                sampleName: 'kick.wav'
                transpose: 0
                level: 1
                key: 0
                start: 0
                volumeEnv:
                  a: 0
                  d: 1
                  s: 1
                  r: 1
              }, {
                name: 'Snare'
                sampleData: results.snare.getChannelData 0
                sampleName: 'snare.wav'
                transpose: 0
                level: 0.35
                key: 1
                start: 0
                volumeEnv:
                  a: 0
                  d: 1
                  s: 1
                  r: 1
              }, {
                name: 'High Hat'
                sampleData: results.hat.getChannelData 0
                sampleName: 'hat.wav'
                transpose: 0
                level: 0.2
                key: 2
                start: 0
                volumeEnv:
                  a: 0
                  d: 1
                  s: 1
                  r: 1
              }
            ]
        }
      ]

    cb data for cb in callbacks
