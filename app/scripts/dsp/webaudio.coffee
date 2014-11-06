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
  window._SAMPLERATE = self.sampleRate = self.rate = context.sampleRate
  self.duration = Infinity

  self.onaudioprocess = (e) ->
    output = e.outputBuffer.getChannelData 0
    self.tick output

  # a fill-a-buffer function
  self.tick = (output) ->
    for i in [0...bufferSize]
      self.t = self.i / self.rate
      self.i += 1

      output[i] = self.fn self.t, self.i

    output

  self.reset = () ->
    self.i = self.t = 0

  # this timeout seems to be the thing that keeps the audio from clipping #WTFALERT
  setTimeout (-> this.node.disconnect()), 100000000000
  self.connect self.context.destination

  self
