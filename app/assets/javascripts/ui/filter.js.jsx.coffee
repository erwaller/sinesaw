###* @jsx React.DOM ###

@Filter = React.createClass

  render: ->
    `<div className="ui filter">
      <Chooser values={['LP','BP','HP']}/>
      <Knob label="Freq"/>
      <Knob label="Res"/>    
      <label>{this.props.label}</label>
    </div>`