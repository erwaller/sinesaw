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

window.KeyboardJS = require 'keyboardjs'

# # inject request animation frame batching strategy into
# require('react-raf-batching').inject()

setTimeout ->

  require('./default_song') (songData) ->

    historySize = 100
    undos = []
    redos = []
    data = Immutable.fromJS songData

    undo = ->
      return unless undos.length > 0
      redos.push data
      redos.shift() if redos.length > historySize
      data = undos.pop()
      render()

    redo = ->
      return unless redos.length > 0
      undos.push data
      undos.shift() if undos.length > historySize
      data = redos.pop()
      render()

    update = (newData) ->
      undos.push data
      undos.shift() if undos.length > historySize
      data = newData
      render()

    render = ->
      React.renderComponent App({undo, redo, song: data.cursor update}), document.body

    render()
