# @cjsx React.DOM

React = require 'react'
Chooser = require './chooser'
Knob = require './knob'

module.exports = React.createClass

  render: ->
    osc = @props.osc

    <div className="ui oscillator">
      <Chooser options={['sine','square','saw']} value={osc.get 'waveform'} onChange={osc.bind 'waveform'}/>
      <Knob label="Level" value={osc.get 'level'} onChange={osc.bind 'level'}/>
      <Knob label="Pitch" value={osc.get 'pitch'} onChange={osc.bind 'pitch'}/>
      <Knob label="Tune" value={osc.get 'tune'} onChange={osc.bind 'tune'}/>
      <label>{@props.label}</label>
    </div>
