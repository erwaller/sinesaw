###* @jsx React.DOM ###

@Envelope = React.createClass

  mixins: [elementSizeMixin]

  render: ->
    lines = []
    dots = []

    `<div className='ui envelope'>
      <div className='control' ref='container'>
        <svg width={this.state.width} height={this.state.height}>
          {lines}
          {dots}
        </svg>
      </div>
      <div className='knobs'>
        <Knob label='A'/>
        <Knob label='D'/>
        <Knob label='S'/>
        <Knob label='R'/>
      </div>
      <label>{this.props.label}</label>
    </div>`