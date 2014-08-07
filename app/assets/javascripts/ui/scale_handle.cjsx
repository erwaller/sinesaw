# @cjsx React.DOM

React = require 'react'
Draggable = require './mixins/draggable'

module.exports = React.createClass

  range: 300

  mixins: [Draggable]

  getInitialState: ->
    active: false

  onDragStart: ->
    # normalize value
    @initalValue = (@props.value - @props.min) / (@props.max - @props.min)
    @state.active = true

  onDrag: (delta) ->
    upRange = Math.min @range, (@dragStartPosition.y - window.scrollY)
    downRange = Math.min @range, (window.innerHeight + window.scrollY - @dragStartPosition.y)

    if delta.y < 0
      value = Math.max 0, @initalValue * (downRange + delta.y) / downRange
    else
      value = Math.min 1, @initalValue + (1 - @initalValue) * delta.y / upRange

    # denormalize value
    value = 1 * @props.min + value * (@props.max - @props.min)
    @props.onChange value

  onDragEnd: ->
    @initalValue = null
    @state.active = false

  render: ->
    className = 'ui scale-handle'
    className += ' active' if @state.active

    <div className={className} onMouseDown={@draggableOnMouseDown}>
      {@props.children}
    </div>