###* @jsx React.DOM ###

@Knob = React.createClass

  render: ->
    style = '-webkit-transform': 'rotate(45deg)'

    `<div className="ui knob">
      <div className="control">
        <div className="handle" style={style}/>
      </div>
      <label>{this.props.label}</label>
    </div>`