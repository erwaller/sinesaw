###* @jsx React.DOM ###

@Slider = React.createClass
  
  mixins: [SizeMeasurable, Draggable]

  getInitialState: ->
    active: false

  onDragStart: ->
    @initalValue = @props.value
    @setState active: true

  onDrag: (delta) ->
    value = @initalValue + delta.y / @state.height
    value = Math.max(0, Math.min(value, 1))
    @props.onChange value

  onDragEnd: ->
    @initalValue = null
    @setState active: false

  render: ->
    style = top: "#{100*(1 - @props.value)}%"

    className = 'ui slider'
    className += ' active' if @state.active

    `<div className={className}>
      <div className="control" ref="container">
        <div className="track"/>
        <div className="handle" style={style} onMouseDown={this.draggableOnMouseDown}/>
      </div>
      <label>{this.props.label}</label>
    </div>`