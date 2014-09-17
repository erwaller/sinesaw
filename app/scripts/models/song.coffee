Model = require './model'
webaudio = require '../dsp/webaudio'
context = require '../dsp/global_context'

module.exports = class Song extends Model

  clockRatio = 230

  defaults:
    bpm: 120
    playing: false
    recording: false
    position: 0
    tracks: []

  clip = (sample) ->
    Math.min(2, sample + 1) - 1

  constructor: ->
    super
    @audio = webaudio context, @out

  addTrack: (track) =>
    tracks = @state.tracks.slice 0
    tracks.push track
    @set {tracks}

  removeTrack: (index) =>
    tracks = @state.tracks.slice 0
    tracks.splice index, 1
    @set {tracks}

  out: (time, i) =>
    @tick time, i if i % clockRatio is 0

    clip @state.tracks.reduce((sample, t) ->
      sample + t.out time, i
    , 0)

  tick: (time, i) ->
    bps = @state.bpm / 60
    beat = time * bps

    # update ui state on 1/4th notes
    b = Math.floor(beat * 4) / 4
    @set position: b if b > @state.position 

    track.tick time, i, beat, bps for track in @state.tracks 

  play: =>
    @set playing: true
    @audio.play()

  pause: =>
    @set playing: false
    @audio.stop()

  record: =>
    @set recording: !@state.recording

  stop: =>
    @audio.stop()
    @audio.reset()
    track.reset() for track in @state.tracks
    @set playing: false, recording: false, position: 0

  toJSON: ->
    result = bpm: @state.bpm
    result.tracks = @state.tracks.map (t) -> t.toJSON()
    result
