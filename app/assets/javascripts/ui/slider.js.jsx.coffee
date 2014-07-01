###* @jsx React.DOM ###

@Slider = React.createClass
  
  mixins: [SizeMeasurable, Draggable]

  onDragStart: ->
    @initalValue = @props.value
    @getDOMNode().classList.add 'active'

  onDrag: (delta) ->
    value = @initalValue - delta.y / @state.height
    value = Math.max(0, Math.min(value, 1))
    @props.onChange value

  onDragEnd: ->
    @initalValue = null
    @getDOMNode().classList.remove 'active'

  render: ->
    style = top: "#{100*@props.value}%"
  
    `<div className="ui slider">
      <div className="control" ref="container">
        <div className="track"/>
        <div className="handle" style={style} onMouseDown={this.draggableOnMouseDown}/>
      </div>
      <label>{this.props.label}</label>
    </div>`