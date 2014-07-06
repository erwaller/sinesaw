class @Song extends Model

  clockRatio = 100

  defaults:
    bpm: 120
    playing: false
    recording: false
    position: 0

  constructor: ->
    super
    @tracks = []
    @ctx = new webkitAudioContext
    @audio = webaudio @ctx, @out

  out: (time, i) =>
    @tick time, i if i % clockRatio is 0

    @tracks.reduce((sample, t) ->
      sample + t.out time
    , 0)

  tick: (time) ->
    bps = @state.bpm / 60
    beat = time * bps

    # update ui state on 32nd notes
    b = Math.floor(beat * 16)/16
    if b > @state.position 
      @set(position: b)

    track.tick time, beat, bps for track in @tracks 

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
    track.reset for track in @tracks
    @set playing: false, recording: false, position: 0
