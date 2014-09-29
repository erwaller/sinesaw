# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Chooser = require './chooser'
Knob = require './knob'

module.exports = React.createClass

  mixins: [Modelable]

  render: ->
    filter = @props.filter

    <div className="ui filter">
      <Chooser options={['LP','HP','none']} value={filter.get 'type'} onChange={@updateCursor filter, 'type'}/>
      <Knob label="Freq" value={filter.get 'freq'} onChange={@updateCursor filter, 'freq'}/>
      <Knob label="Res" value={filter.get 'res'} onChange={@updateCursor filter, 'res'}/>    
      <Knob label="Env" value={filter.get 'env'} onChange={@updateCursor filter, 'env'}/>
      <label>{@props.label}</label>
    </div>