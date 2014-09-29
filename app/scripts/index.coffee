window.React = require 'react'
window.Immutable = require 'immutable'
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

RingBuffer = require './util/ring_buffer'

# # inject request animation frame batching strategy into
# require('react-raf-batching').inject()

setTimeout ->
  
  require('./default_song') (songData) ->

    undos = new RingBuffer 100, Array
    redos = new RingBuffer 100, Array

    render = (data) ->
      undos.push data
      React.renderComponent App(song: data.cursor render), document.body

    render Immutable.fromJS songData
