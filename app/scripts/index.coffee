window.React = require 'react'
window.App = require './app'

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

# # inject request animation frame batching strategy into
# require('react-raf-batching').inject()

setTimeout ->

  require('./default_song') (songData) ->
    ImmutableData.create songData, (song, undo, redo) ->
      React.renderComponent App({song, undo, redo}), document.body
