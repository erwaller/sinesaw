React = require 'react/addons'
Draggable = require '../mixins/draggable'


module.exports = React.createClass

  mixins: [Draggable]

  render: ->
    @transferPropsTo <div onMouseDown={@draggableOnMouseDown}/>

