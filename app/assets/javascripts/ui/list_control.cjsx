# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass

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
        <div>Add</div>
      </div>
    </div>
