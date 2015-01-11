ImmutableData = require '../util/immutable_data'

module.exports = class MidiBridge

  constructor: ->
    @error = false
    @enabled = false
    ImmutableData.create {}, (notes) => @notes = notes

    if navigator.requestMIDIAccess?
      @enabled = true
      navigator.requestMIDIAccess().then @onMIDIInit, @onMIDISystemError

  onMIDIInit: (midi) =>
    @midi = midi
    @inputs = []

    iterator = midi.inputs.values()

    while not done
      {value, done} = iterator.next()
      unless done
        @inputs.push value
        value.onmidimessage = @onMIDIMessage

  onMIDISystemError: =>
    @error = true

  onMIDIMessage: (e) =>
    cmd = e.data[0] >> 4
    channel = e.data[0] & 0xf
    noteNumber = e.data[1]
    velocity = if e.data.length > 2 then e.data[2] else 0

    # noteoff (noteon with velocity=0 is the same as noteoff)
    if cmd is 8 or (cmd is 9 and velocity is 0)
      @noteOff noteNumber
    # noteon
    else if cmd is 9
      @noteOn noteNumber, velocity
    # controller message
    else if cmd is 11
      @controller noteNumber, velocity
    # probably sysex!
    else
      null

  noteOn: (number, velocity) ->
    @notes.set [number], {on: Date.now(), velocity}

  noteOff: (number, velocity) ->
    @notes.set [number, 'off'], Date.now()

  controller: ->