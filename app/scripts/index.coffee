do ->
  window.React = require 'react'
  Modal = require './ui/modal'
  App = require './app'

  Song = require './models/song'
  Track = require './models/track'
  AnalogSynthesizer = require './models/analog_synthesizer'
  BasicSampler = require './models/basic_sampler'
  DrumSampler = require './models/drum_sampler'
  DrumkitSynthesizer = require './models/drumkit_synthesizer'
  LoopSampler = require './models/loop_sampler'

  # # inject request animation frame batching strategy into
  # require('react-raf-batching').inject()

  async = require 'async'
  fs = require 'fs'
  b2a = require 'base64-arraybuffer'
  bass = b2a.decode fs.readFileSync "#{__dirname}/../audio/bass.wav", 'base64'
  kick = b2a.decode fs.readFileSync "#{__dirname}/../audio/kick.wav", 'base64'
  snare = b2a.decode fs.readFileSync "#{__dirname}/../audio/snare.wav", 'base64'
  hat = b2a.decode fs.readFileSync "#{__dirname}/../audio/hat.wav", 'base64'
  decoder = new webkitAudioContext

  async.parallel({
    bass: (cb) -> decoder.decodeAudioData bass, (buffer) -> cb null, buffer
    kick: (cb) -> decoder.decodeAudioData kick, (buffer) -> cb null, buffer
    snare: (cb) -> decoder.decodeAudioData snare, (buffer) -> cb null, buffer
    hat: (cb) -> decoder.decodeAudioData hat, (buffer) -> cb null, buffer
  }, (err, results) ->

    BasicSampler.prototype.defaults.sampleData = results.bass.getChannelData 0
    BasicSampler.prototype.defaults.sampleName = 'test.wav'
    DrumSampler.prototype.defaults.drums = [
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

    window.song = new Song
    
    song.set tracks: [
      new Track name: 'Basic Sampler', new BasicSampler
      new Track name: 'Drum Sampler', new DrumSampler
      # new Track name: 'Drum Synth', new DrumkitSynthesizer
      # new Track name: 'Loop Sampler', new LoopSampler
      # new Track name: 'Analog Synth', new AnalogSynthesizer
    ]

    setTimeout ->
      React.renderComponent App(song: song), document.body
  )
