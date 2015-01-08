bufferSize = 4096

module.exports = (context, fn) ->

  # accept a single argument
  if typeof context is 'function'
    Context = window.AudioContext or window.webkitAudioContext
    throw new Error 'AudioContext not supported' unless Context
    fn = context
    context = new Context()

  self = context.createScriptProcessor bufferSize, 1, 1
  self.fn = fn
  self.i = self.t = 0
  self.sampleRate = context.sampleRate
  self.duration = Infinity
  self.playing = false

  bufferStartAbsolute = null
  bufferStartRelative = null

  self.onaudioprocess = (e) ->
    bufferStartAbsolute = Date.now()
    bufferStartRelative = self.t

    output = e.outputBuffer.getChannelData 0

    for i in [0...bufferSize]
      self.t = self.i / self.sampleRate
      self.i += 1

      output[i] = self.fn self.t, self.i

    output

  self.getTime = ->
    if bufferStartRelative?
      bufferStartRelative + (Date.now() - bufferStartAbsolute) / 1000
    else
      self.t

  self.seek = (time) ->
    bufferStartAbsolute = null
    bufferStartRelative = null
    self.i = Math.floor(time * self.sampleRate)
    self.t = time

  self.play = (opts) ->
    return if self.playing
    self.connect self.context.destination
    self.playing = true

    # this timeout seems to be the thing that keeps the audio from clipping #WTFALERT
    setTimeout (-> this.node.disconnect()), 100000000000

  self.stop = ->
    bufferStartAbsolute = null
    bufferStartRelative = null
    self.playing = false
    self.disconnect()

  self.reset = ->
    self.i = self.t = 0

  self
