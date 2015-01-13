context = require '../dsp/components/global_context'
MidiInput = require './midi_input'


callbackId = 0


module.exports = class SongBridge
  bufferSize: 2048

  constructor: ->
    @node = context.createScriptProcessor @bufferSize, 1, 1
    @node.onaudioprocess = @handleAudioProcess

    @midi = new MidiInput
    @midi.onMessage @handleMidiInput

    @worker = new Worker '/dsp.js'
    @worker.onmessage = @handleMessage

    @state = {}
    @frameHandlers = []

    @sampleRate = context.sampleRate
    @i = @t = 0
    @playing = false
    @bufferStartAbsolute = null
    @bufferPeding = false
    @buffer = new Float32Array @bufferSize

  destroy: ->
    @node.disconnect()
    @worker.terminate()

  handleAudioProcess: (e) =>
    # copy existing buffer to output channel
    channelData = e.outputBuffer.getChannelData(0).set @buffer

    # request a new buffer
    @requestBuffer() unless @bufferPending

    # increment time and index
    @i += @bufferSize
    @t = @i / @sampleRate
    @bufferStartAbsolute = Date.now()

  handleMidiInput: (message) =>
    @worker.postMessage {type: 'midi', message}

  handleMessage: (e) =>
    switch e.data.type
      when 'buffer'
        @bufferPending = false
        @buffer = new Float32Array e.data.buffer
      when 'frame'
        fn e.data.frame for fn in @frameHandlers

  requestBuffer: ->
    @bufferPending = true
    @worker.postMessage
      type: 'buffer'
      size: @bufferSize
      index: @i
      sampleRate: @sampleRate

  onFrame: (fn) ->
    @frameHandlers.push fn

  offFrame: (fn) ->
    i = @frameHandlers.indexOf fn
    @frameHandlers.splice i, 1 if i > -1

  update: (cursor) ->
    @state = cursor.get()
    @worker.postMessage {type: 'update', @state}

  # begin playback
  play: =>
    return if @playing
    @node.connect context.destination
    @playing = true

    # this timeout seems to be the thing that keeps the audio from clipping
    setTimeout (-> this.node.disconnect()), 100000000000

  # stop playback
  pause: =>
    @playing = false
    @bufferStartAbsolute = null
    @node.disconnect()

  # stop playback and set current time to 0
  stop: =>
    @pause()
    @i = @t = 0
    @buffer = new Float32Array @bufferSize

  # seek to provided beat
  seek: (beat) =>
    @t = beat * 60 / @state.bpm
    @i = Math.floor(time * @sampleRate)
    @bufferStartAbsolute = null

  # return current time in seconds
  getTime: =>
    if @bufferStartAbsolute?
      @t + (Date.now() - @bufferStartAbsolute) / 1000
    else
      @t

  # return current position in beats (based on bpm)
  getPosition: =>
    @getTime() * @state.bpm / 60
