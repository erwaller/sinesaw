Model = require './model'
Sequence = require './sequence'
AudioRecorder = require '../dsp/audio_recorder'
context = require '../dsp/global_context'

module.exports = class Recording extends Model

  meterDecay = 0.0005

  defaults:
    sampleData: null
    error: null
    active: false
    playing: false

  record: =>
    return if @state.active
    
    @clear()

    navigator.webkitGetUserMedia
      audio: true
      (localMediaStream) =>
        input = context.createMediaStreamSource localMediaStream
        @recorder = new AudioRecorder input
        @set active: true
        @recorder.record()
      (errorCode) =>
        @set error: 'Unable to access microphone'

  stop: =>
    return unless @state.active

    if @player
      @player.onended = false
      @player.stop()
  
    @recorder.stop().getSampleData (sampleData) =>
      @recorder = null
      @set
        sampleData: sampleData
        error: null
        active: false
        playing: false

  play: =>
    if @player
      @player.onended = null
      @player.stop()
      @player.disconnect context.destination

    @player = context.createBufferSource()
    @player.connect context.destination
    audioBuffer = context.createBuffer 1, @state.sampleData.length, context.sampleRate
    audioBuffer.getChannelData(0).set @state.sampleData
    @player.buffer = audioBuffer
    @player.onended = => @set playing: false
    @player.start()
    
    @set playing: true

  clear: =>
    @set
      sampleData: null
      error: null
      active: false
      playing: false
