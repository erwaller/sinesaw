# @cjsx React.DOM

React = require 'react'

module.exports = React.createClass
  
  render: ->
    <div>
      <div className="modal-backdrop"/>
      <div className="modal-body">
        {@props.children}
      </div>
    </div>