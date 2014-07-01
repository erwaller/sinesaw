###* @jsx React.DOM ###

@Channel = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    level: 1
    pan: 0.5

  render: ->
    `<div className="ui channel">
      <Slider label="Level" value={this.state.level} onChange={this.update('level')}/>
      <Knob label="Pan" value={this.state.pan} onChange={this.update('pan')}/>
    </div>`