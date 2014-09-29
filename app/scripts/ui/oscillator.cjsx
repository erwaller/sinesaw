# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Chooser = require './chooser'
Knob = require './knob'

module.exports = React.createClass

  mixins: [Modelable]

  render: ->
    osc = @props.osc

    <div className="ui oscillator">
      <Chooser options={['sine','square','saw']} value={osc.get 'waveform'} onChange={@updateCursor osc, 'waveform'}/>
      <Knob label="Level" value={osc.get 'level'} onChange={@updateCursor osc, 'level'}/>
      <Knob label="Pitch" value={osc.get 'pitch'} onChange={@updateCursor osc, 'pitch'}/>
      <Knob label="Tune" value={osc.get 'tune'} onChange={@updateCursor osc, 'tune'}/>
      <label>{@props.label}</label>
    </div>
