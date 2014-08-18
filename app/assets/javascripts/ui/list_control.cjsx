# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass

  onRemove: ->
    @props.onRemove @props.selectedIndex

  render: ->
    options = @props.options.map (name, i) =>
      className = 'option'
      className += ' selected' if i == @props.selectedIndex
      onClick = => @props.onSelect i
      <div key={i} className={className} onClick={onClick}>{name}</div>
    
    <div className="ui list-control">
      <div className="list">
        {options}
      </div>
      <div className="controls">
        <div className="icon icon-plus pull-right" onClick={@props.onAdd}></div>
        <div className="icon icon-minus pull-left" onClick={@onRemove}></div>
      </div>
    </div>
