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
    cropStart: 0
    cropEnd: 1

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

  setCropStart: (value) =>
    @set
      cropStart: value
      cropEnd: Math.max value, @state.cropStart

  setCropEnd: (value) =>
    @set
      cropEnd: value
      cropStart: Math.min value, @state.cropEnd

  croppedSampleData: ->
    length = @state.sampleData.length
    @state.sampleData.subarray Math.floor(@state.cropStart * length), Math.floor(@state.cropEnd * length)

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

    data = @croppedSampleData()

    @player = context.createBufferSource()
    @player.connect context.destination
    audioBuffer = context.createBuffer 1, data.length, context.sampleRate
    audioBuffer.getChannelData(0).set data
    @player.buffer = audioBuffer
    @player.onended = => @set playing: false
    @player.start()
    
    @set playing: true

  clear: =>
    @set @defaults
