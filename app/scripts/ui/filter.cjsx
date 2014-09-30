# @cjsx React.DOM

React = require 'react'
Chooser = require './chooser'
Knob = require './knob'

module.exports = React.createClass

  render: ->
    filter = @props.filter

    <div className="ui filter">
      <Chooser options={['LP','HP','none']} value={filter.get 'type'} onChange={filter.bind 'type'}/>
      <Knob label="Freq" value={filter.get 'freq'} onChange={filter.bind 'freq'}/>
      <Knob label="Res" value={filter.get 'res'} onChange={filter.bind 'res'}/>    
      <Knob label="Env" value={filter.get 'env'} onChange={filter.bind 'env'}/>
      <label>{@props.label}</label>
    </div>