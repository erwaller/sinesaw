###* @jsx React.DOM ###

@Oscillator = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    waveform: 'Sin'
    level: 0.5
    tune: 0.5

  render: ->
    `<div className="ui oscillator">
      <Chooser options={['Sin','Sqare','Saw']} value={this.state.waveform} onChange={this.update('waveform')}/>
      <Knob label="Level" value={this.state.level} onChange={this.update('level')}/>
      <Knob label="Tune" value={this.state.tune} onChange={this.update('tune')}/>    
      <label>{this.props.label}</label>
    </div>`