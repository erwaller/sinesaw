# @cjsx React.DOM

React = require 'react'
Chooser = require './chooser'
Knob = require './knob'

module.exports = React.createClass

  update: (attr) ->
    (value) =>
      osc = {}
      for k, v of @props.osc
        osc[k] = if k == attr then value else v
      @props.onChange osc

  render: ->
    <div className="ui oscillator">
      <Chooser options={['sine','square','saw']} value={@props.osc.waveform} onChange={@update('waveform')}/>
      <Knob label="Level" value={@props.osc.level} onChange={@update('level')}/>
      <Knob label="Pitch" value={@props.osc.pitch} onChange={@update('pitch')}/>    
      <Knob label="Tune" value={@props.osc.tune} onChange={@update('tune')}/>    
      <label>{@props.label}</label>
    </div>