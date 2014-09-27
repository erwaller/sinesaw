# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass

  getDefaultProps: ->
    steps: 6

  render: ->
    level = Math.ceil(@props.track.get('meterLevel') * @props.steps)
    
    steps = for i in [1..@props.steps]
      className = if i <= level then 'on' else ''
      <div key={i} className={className}/>

    <div className="ui meter">
      {steps}
    </div>

  shouldComponentUpdate: (nextProps) ->
    Math.ceil(@props.track.get('meterLevel') * @props.steps) != Math.ceil(nextProps.track.get('meterLevel') * nextProps.steps)
