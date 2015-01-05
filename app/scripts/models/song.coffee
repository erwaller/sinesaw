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
# level meters and playback position.

module.exports = class Song

  # number of samples to process between ticks
  clockRatio = 50

  # rate at which level meters decay
  meterDecay = 0.05

  clip = (sample) ->
    Math.max(0, Math.min(2, sample + 1)) - 1

  constructor: ->
    @audio = webaudio context, @sample
    @lastBeat = 0

    # start calling @frame for every ui frame
    requestAnimationFrame @frame

  update: (cursor) ->
    @cursor = cursor
    @data = cursor.get()

  play: =>
    @audio.play()
    @cursor.set 'playing', true

  pause: =>
    @audio.stop()
    @cursor.set 'playing', false

  stop: =>
    @audio.stop()
    @audio.reset()
    @cursor.batched =>
      @cursor.set 'playing', false
      @cursor.set 'position', 0

  seek: (beat) ->
    @cursor.set 'position', beat
    @audio.seek beat * 60 / @data.bpm

  # called for every sample of audio
  sample: (time, i) =>
    return 0 unless @data?.playing

    @tick time, i if i % clockRatio is 0

    clip @data.tracks.reduce((memo, track) ->
      memo + Track.sample track, time, i
    , 0)

  # called for every clockRatio samples
  tick: (time, i) ->
    bps = @data.bpm / 60
    beat = time * bps

    @data.tracks.forEach (track) =>
      Track.tick track, time, i, beat, @lastBeat, bps

    @lastBeat = beat

  # called for every ui animation frame
  frame: =>
    @cursor.batched =>
      for trackIndex, track of @data.tracks
        meterLevel = Track.meterLevels[track._id] or 0
        @cursor.set ['tracks', trackIndex, 'meterLevel'], (meterLevel || 0)

      @cursor.set 'position', @audio.getTime() * @data.bpm / 60


    for id, level of Track.meterLevels
      Track.meterLevels[id] = level - meterDecay
      delete Track.meterLevels[id] if Track.meterLevels[id] < 0

    requestAnimationFrame @frame
