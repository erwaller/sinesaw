# @cjsx React.DOM

React = require 'react'
Draggable = require './mixins/draggable'

module.exports = React.createClass

  range: 100

  mixins: [Draggable]

  getInitialState: ->
    active: false

  getDefaultProps: ->
    value: 0.5

  onDragStart: ->
    @initalValue = @props.value
    @setState active: true

  onDrag: (delta) ->
    upRange = Math.min @range, (@dragStartPosition.y - window.scrollY)
    downRange = Math.min @range, (window.innerHeight + window.scrollY - @dragStartPosition.y)

    if delta.y < 0
      value = Math.max 0, @initalValue * (downRange + delta.y) / downRange
    else
      value = Math.min 1, @initalValue + (1 - @initalValue) * delta.y / upRange

    @props.onChange value

  onDragEnd: ->
    @initalValue = null
    @setState active: false

  render: ->
    style = '-webkit-transform': "rotate(#{(@props.value - 0.5) * 300}deg)"
    
    className = 'ui knob'
    className += ' active' if @state.active

    <div className={className}>
      <div className="control">
        <div className="handle" style={style} onMouseDown={@draggableOnMouseDown}/>
      </div>
      <label>{@props.label}</label>
    </div>