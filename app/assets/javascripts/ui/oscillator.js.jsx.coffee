###* @jsx React.DOM ###

@Oscillator = React.createClass

  render: ->
    `<div className="ui oscillator">
      <Chooser values={['Sin','Sqare','Saw']}/>
      <Knob label="Level"/>
      <Knob label="Tune"/>    
      <label>{this.props.label}</label>
    </div>`