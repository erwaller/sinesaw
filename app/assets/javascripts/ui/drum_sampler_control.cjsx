# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Knob = require './knob'
Slider = require './slider'

module.exports = React.createClass

  mixins: [Modelable('instrument')]

  render: ->
    <div className="ui drum-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={@state.level}
          onChange={@props.instrument.createSetterFor('level')}
        />
        <Knob
          label="Pan"
          value={@state.pan}
          onChange={@props.instrument.createSetterFor('pan')}
        />
      </div>
    </div>