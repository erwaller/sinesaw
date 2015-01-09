webaudio = require '../dsp/webaudio'
window.context = require '../dsp/global_context'
Track = require './track'

# there are three time scales that we are concerned with
#
# - sample rate
# runs at 44100 hz, once for each sample of audio we output.  Any code running
# at this rate has a high cost, so performance is important here
#
# - tick rate
# Ticks run every n samples, defined using the clockRatio variable.  This
# allows us to do processing that needs to run frequently, but is too expensive
# to run for each smaple.  For example, this is the time resolution at which
# we trigger new notes.
#
# - frame rate
# The frame rate is the speed at which we trigger GUI updates for things like
# level meters and playback position.  we continue to run frame updates whether
# on not audio is playing


module.exports = class Song

  # number of samples to process between ticks
  clockRatio = 500

  # rate at which level meters decay
  meterDecay = 0.05

  clip = (sample) ->
    Math.max(0, Math.min(2, sample + 1)) - 1

  constructor: ->
    @audio = webaudio context, @sample
    @lastBeat = 0

    # keep mutable state for audio playback here - this will store things
    # like filter memory and meter levels that need to stay outside the normal
    # cursor structure for performance reasons
    @state = {}

    # start running frames
    requestAnimationFrame @frame

  update: (cursor) ->
    @data = cursor.get()

  play: =>
    @audio.play()

  pause: =>
    @audio.stop()

  stop: =>
    @audio.stop()
    @audio.reset()

  seek: (beat) =>
    @audio.seek beat * 60 / @data.bpm

  position: =>
    @audio.getTime() * @data.bpm / 60

  # called for every sample of audio
  sample: (time, i) =>
    @tick time, i if i % clockRatio is 0

    clip @data.tracks.reduce((memo, track) =>
      memo + Track.sample @state, track, time, i
    , 0)

  # called for every clockRatio samples
  tick: (time, i) =>
    bps = @data.bpm / 60
    beat = time * bps

    @data.tracks.forEach (track) =>
      Track.tick @state, track, time, i, beat, @lastBeat, bps

    @lastBeat = beat

  # called for every ui animation frame
  # this should eventually be updated to base the amount of decay on the actual
  # elpased time because the rate of requestAnimationFrame is not gauranteed
  frame: =>
    # apply decay to meter levels
    for track in @data.tracks
      if @state[track._id]?
        @state[track._id].meterLevel -= meterDecay

    requestAnimationFrame @frame
