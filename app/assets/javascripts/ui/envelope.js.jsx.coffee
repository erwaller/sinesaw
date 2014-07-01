###* @jsx React.DOM ###

EnvelopeHandle = React.createClass

@Envelope = React.createClass

  mixins: [SizeMeasurable, Updatable]

  getInitialState: ->
    a: 0.5
    d: 0.5
    s: 0.5
    r: 0.5

  getDefaultProps: ->
    dotRadius: 5
    margin: 4

  buildLines: ->
    lines = []
    dots = []
    m = @props.margin + @props.dotRadius
    w = @state.width - 2 * m
    h = @state.height - 2 * m

    p1 =
      x: 0
      y: h
    
    p2 =
      x: w / 3 * @state.a
      y: 0
    
    p3 =
      x: p2.x + w / 3 * @state.d
      y: h * (1 - @state.s)
    
    p4 =
      x: w * 2 / 3
      y: h * (1 - @state.s)
    
    p5 =
      x: w * (2 + @state.r) / 3
      y: h

    for p in [p1, p2, p3, p4, p5]
      p.x += m
      p.y += m

    # baseline
    lines.push `<line x1={m} y1={m+h} x2={m+w} y2={m+h}/>`

    # path
    d = 'M ' + [p1, p2, p3, p4, p5].map((p) -> "#{p.x} #{p.y}").join ' L '
    lines.push `<path d={d}/>`

    # attack
    dots.push `<circle cx={p2.x} cy={p2.y} r={this.props.dotRadius}/>`

    # decay / sustain
    dots.push `<circle cx={p3.x} cy={p3.y} r={this.props.dotRadius}/>`

    #release
    dots.push `<circle cx={p5.x} cy={p5.y} r={this.props.dotRadius}/>`

    lines.concat dots

  render: ->
    lines = @buildLines() if @state.width > 0

    `<div className='ui envelope'>
      <div className='control' ref='container'>
        <svg width={this.state.width} height={this.state.height}>
          {lines}
        </svg>
      </div>
      <div className='knobs'>
        <div className='group'>
          <Knob label='A' value={this.state.a} onChange={this.update('a')}/>
          <Knob label='D' value={this.state.d} onChange={this.update('d')}/>
        </div>
        <div className='group'>
          <Knob label='S' value={this.state.s} onChange={this.update('s')}/>
          <Knob label='R' value={this.state.r} onChange={this.update('r')}/>
        </div>
      </div>
      <label>{this.props.label}</label>
    </div>`