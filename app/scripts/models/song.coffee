webaudio = require '../dsp/webaudio'
context = require '../dsp/global_context'
Track = require './track'

module.exports = class Song

  clockRatio = 230

  clip = (sample) ->
    Math.max(0, Math.min(2, sample + 1)) - 1

  constructor: ->
    @audio = webaudio context, @out

  update: (cursor) ->
    @cursor = cursor
    @data = cursor.get()

  out: (time, i) =>
    return 0 unless @data?.playing

    @tick time, i if i % clockRatio is 0

    clip @data.tracks.reduce((sample, track) ->
      sample + Track.out track, time, i
    , 0)

  tick: (time, i) ->
    bps = @state.bpm / 60
    beat = time * bps

    # update ui state on 1/4th notes
    b = Math.floor(beat * 4) / 4
    @cursor.set 'position', b if b > @state.position

    @data.tracks.forEach (track) ->
      Track.tick data, time, i, beat, bps