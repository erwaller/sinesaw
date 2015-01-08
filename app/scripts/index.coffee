ImmutableData = require './util/immutable_data'
UndoHistory = require './util/undo_history'
React = require 'react/addons'
Song = require './models/song'
App = require './ui/app'


# development only code
if process.env.NODE_ENV is 'development'

  # setup gulp build status / autoreload
  (require 'build-status').client()

  # set these on window for debugging / react dev tools chrome extension
  window.React = React
  window.App = App
  window.Song = Song
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

# inject request animation frame batching strategy into react
# require('react-raf-batching').inject()

# load default song, setup immutable data, and render app

document.addEventListener 'DOMContentLoaded', ->

  require('./default_song') (songData) ->

    song = new Song

    ImmutableData.create songData, (data, history) ->
      window.data = data if process.env.NODE_ENV is 'development'
      song.update data
      React.renderComponent App({data, song, history}), document.body
