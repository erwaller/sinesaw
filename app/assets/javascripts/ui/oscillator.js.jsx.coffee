###* @jsx React.DOM ###

@Oscillator = React.createClass

  update: (attr) ->
    (value) =>
      osc = {}
      for k, v of @props.osc
        osc[k] = if k == attr then value else v
      @props.onChange osc

  render: ->
    `<div className="ui oscillator">
      <Chooser options={['sine','square','saw']} value={this.props.osc.waveform} onChange={this.update('waveform')}/>
      <Knob label="Level" value={this.props.osc.level} onChange={this.update('level')}/>
      <Knob label="Pitch" value={this.props.osc.pitch} onChange={this.update('pitch')}/>    
      <Knob label="Tune" value={this.props.osc.tune} onChange={this.update('tune')}/>    
      <label>{this.props.label}</label>
    </div>`