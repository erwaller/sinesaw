###* @jsx React.DOM ###

@Filter = React.createClass

  update: (attr) ->
    (value) =>
      filter = {}
      for k, v of @props.filter
        filter[k] = if k == attr then value else v
      @props.onChange filter

  render: ->
    `<div className="ui filter">
      <Chooser options={['LP','HP','none']} value={this.props.filter.type} onChange={this.update('type')}/>
      <Knob label="Freq" value={this.props.filter.freq} onChange={this.update('freq')}/>
      <Knob label="Res" value={this.props.filter.res} onChange={this.update('res')}/>    
      <Knob label="Env" value={this.props.filter.env} onChange={this.update('env')}/>
      <label>{this.props.label}</label>
    </div>`