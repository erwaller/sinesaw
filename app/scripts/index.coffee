window.React = require 'react'
window.App = require './app'
window.Song = require './models/song'

# export these for better error messages
window.TrackSelection = require './ui/track_selection'
window.Meter = require './ui/meter'
window.PianoRoll = require './ui/piano_roll'
window.GridLines = require './ui/piano_roll/grid_lines'
window.Keys = require './ui/piano_roll/keys'
window.Notes = require './ui/piano_roll/notes'
window.PlaybackMarker = require './ui/piano_roll/playback_marker'
window.Selection = require './ui/piano_roll/selection'

ImmutableData = require './util/immutable_data'


# setup gulp build status / autoreload
(require 'build-status').client()


# # inject request animation frame batching strategy into
# require('react-raf-batching').inject()

setTimeout ->

  require('./default_song') (songData) ->

    window.song = new Song

    ImmutableData.create songData, (data, undo, redo) ->
      song.update data
      React.renderComponent App({data, undo, redo}), document.body
