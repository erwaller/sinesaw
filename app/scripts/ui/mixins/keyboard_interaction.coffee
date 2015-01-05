# global keyboard controls mixin, included by the App component

window.Keyboard = require 'keyboardjs'

module.exports =

  componentDidMount: ->
    @keyBindings = [
      Keyboard.on 'space', @onSpaceKey
      Keyboard.on 'z', @undo
      Keyboard.on 'shift + z', @redo
    ]

  componentWillUnmount: ->
    binding.clear() for binding in @keyBindings

  onSpaceKey: (e) ->
    e.preventDefault()
    if @props.data.get 'playing'
      @props.song.pause()
    else
      @props.song.play()

  undo: (e) ->
    if e.metaKey
      @props.undo()

  redo: ->
    if e.metaKey
      @props.redo()
