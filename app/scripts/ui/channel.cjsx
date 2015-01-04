# A volume slider and pan knob, arranged like channel on a mixing board

React = require 'react'

module.exports = React.createClass

  getInitialState: ->
    level: 1
    pan: 0.5

  render: ->
    <div className="ui channel">
      <Slider
        label="Level"
        value={@state.level}
        onChange={(level) => @setState {level}}
      />
      <Knob
        label="Pan"
        value={@state.pan}
        onChange={(pan) => @setState {pan}}
      />
    </div>