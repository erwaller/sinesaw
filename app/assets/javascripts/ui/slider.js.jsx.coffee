###* @jsx React.DOM ###

@Slider = React.createClass

  render: ->
    style = top: '100%'
  
    `<div className="ui slider">
      <div className="control">
        <div className="track"/>
        <div className="handle" style={style}/>
      </div>
      <label>{this.props.label}</label>
    </div>`