# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    level: 1
    pan: 0.5

  render: ->
    <div className="ui channel">
      <Slider label="Level" value={@state.level} onChange={@update('level')}/>
      <Knob label="Pan" value={@state.pan} onChange={@update('pan')}/>
    </div>