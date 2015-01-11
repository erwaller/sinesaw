ImmutableData = require './util/immutable_data'
React = require 'react/addons'
SongBridge = require './models/song_bridge'
App = require './ui/app'


# development only code
if process.env.NODE_ENV is 'development'

  # setup gulp build status / autoreload
  (require 'build-status').client()

  # set these on window for debugging / react dev tools chrome extension
  window.React = React
  window.App = App
  window.SongBridge = SongBridge
  window.Track = require './models/track'
  window.DrumSampler = require './models/drum_sampler'
  window.BasicSampler = require './models/basic_sampler'
  window.TrackSelection = require './ui/track_selection'
  window.Meter = require './ui/meter'
  window.PianoRoll = require './ui/piano_roll'
  window.GridLines = require './ui/piano_roll/grid_lines'
  window.Keys = require './ui/piano_roll/keys'
  window.Notes = require './ui/piano_roll/notes'
  window.PlaybackMarker = require './ui/piano_roll/playback_marker'
  window.Selection = require './ui/piano_roll/selection'


# load default song, setup immutable data, and render app
document.addEventListener 'DOMContentLoaded', ->

  require('./extra/default_song') (songData) ->

    window.song = new SongBridge
    data = null
    history = null
    playbackState = null

    render = ->
      React.render(
        React.createElement(App, {song, data, playbackState, history}),
        document.body
      )

    # called every time song data changes
    ImmutableData.create songData, (d, h) ->
      data = d
      history = h
      song.update data
      render()

    # called when playback state is received from audio processing thread
    song.onFrame (state) ->
      playbackState = state
      render()

    # # called for every ui animation frame
    # frame = =>
    #   React.render(
    #     React.createElement(App, {song, data, history}),
    #     document.body
    #   )
    #   requestAnimationFrame frame

    # frame()
