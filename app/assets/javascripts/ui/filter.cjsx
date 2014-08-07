# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass

  update: (attr) ->
    (value) =>
      filter = {}
      for k, v of @props.filter
        filter[k] = if k == attr then value else v
      @props.onChange filter

  render: ->
    <div className="ui filter">
      <Chooser options={['LP','HP','none']} value={@props.filter.type} onChange={@update('type')}/>
      <Knob label="Freq" value={@props.filter.freq} onChange={@update('freq')}/>
      <Knob label="Res" value={@props.filter.res} onChange={@update('res')}/>    
      <Knob label="Env" value={@props.filter.env} onChange={@update('env')}/>
      <label>{@props.label}</label>
    </div>