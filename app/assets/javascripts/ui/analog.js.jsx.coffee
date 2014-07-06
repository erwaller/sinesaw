###* @jsx React.DOM ###

@Analog = React.createClass

  mixins: [Modelable('instrument')]

  render: ->
    `<div className="ui analog">
      <div className="column channel">
        <Slider label="Level" value={this.state.level} onChange={this.props.instrument.createSetterFor('level')}/>
      </div>
      <div className="column">
        <Envelope label="Volume Env" env={this.props.instrument.state.volumeEnv} onChange={this.props.instrument.setVolumeEnv}/>
      </div>
      <div className="column">
        <Envelope label="Filter Env" env={this.props.instrument.state.filterEnv} onChange={this.props.instrument.setFilterEnv}/>
      </div>
      <div className="column oscillators">
        <Filter label="Filter"/>
        <Oscillator label="Osc 1"/>
        <Oscillator label="Osc 2"/>
      </div>
    </div>`