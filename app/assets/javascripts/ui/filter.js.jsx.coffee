###* @jsx React.DOM ###

@Filter = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    type: 'LP'
    freq: 1
    res: 0
    env: 0.5

  render: ->
    `<div className="ui filter">
      <Chooser options={['LP','BP','HP']} value={this.state.type} onChange={this.update('type')}/>
      <Knob label="Freq" value={this.state.freq} onChange={this.update('freq')}/>
      <Knob label="Res" value={this.state.res} onChange={this.update('res')}/>    
      <Knob label="Env" value={this.state.env} onChange={this.update('env')}/>
      <label>{this.props.label}</label>
    </div>`