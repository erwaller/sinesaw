###* @jsx React.DOM ###

EnvelopeHandle = React.createClass

@Envelope = React.createClass

  mixins: [SizeMeasurable, Updatable, Draggable]

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

    # base
    lines.push `<line key="b" x1={m} y1={m+h} x2={m+w} y2={m+h}/>`

    # path
    d = 'M ' + [p1, p2, p3, p4, p5].map((p) -> "#{p.x} #{p.y}").join ' L '
    lines.push `<path key="p" d={d}/>`

    # attack
    className = if @state.dragTarget is 'attack' then 'active' else ''
    dots.push `<circle key="a" className={className} cx={p2.x} cy={p2.y} r={this.props.dotRadius} onMouseDown={this.onMouseDownAttack}/>`

    # decay / sustain
    className = if @state.dragTarget is 'decay' then 'active' else ''
    dots.push `<circle key="d" className={className} cx={p3.x} cy={p3.y} r={this.props.dotRadius} onMouseDown={this.onMouseDownDecay}/>`

    #release
    className = if @state.dragTarget is 'release' then 'active' else ''
    dots.push `<circle key="r" className={className} cx={p5.x} cy={p5.y} r={this.props.dotRadius} onMouseDown={this.onMouseDownRelease}/>`

    lines.concat dots

  onMouseDownAttack: (e) ->
    @initialValue = @state.a
    @setState dragTarget: 'attack'
    @draggableOnMouseDown e

  onMouseDownDecay: (e) ->
    @initialValue = {d: @state.d, s: @state.s}
    @setState dragTarget: 'decay'
    @draggableOnMouseDown e

  onMouseDownRelease: (e) ->
    @initialValue = @state.r
    @setState dragTarget: 'release'
    @draggableOnMouseDown e

  onDrag: (delta) ->
    m = @props.margin + @props.dotRadius
    w = (@state.width - 2 * m) / 3
    h = @state.height - 2 * m

    if @state.dragTarget is 'attack'
      a = @initialValue - delta.x / w
      changes = {a}
    else if @state.dragTarget is 'decay'
      d = @initialValue.d - delta.x / w
      s = @initialValue.s + delta.y / h
      changes = {d, s}
    else if @state.dragTarget is 'release'
      r = @initialValue - delta.x / w
      changes = {r}

    for k, v of changes
      changes[k] = Math.max 0, Math.min 1, v

    @setState changes

  onDragEnd: ->
    @initialValue = null
    @setState dragTarget: null

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
          <Knob label='Attack' value={this.state.a} onChange={this.update('a')}/>
          <Knob label='Decay' value={this.state.d} onChange={this.update('d')}/>
        </div>
        <div className='group'>
          <Knob label='Sustain' value={this.state.s} onChange={this.update('s')}/>
          <Knob label='Release' value={this.state.r} onChange={this.update('r')}/>
        </div>
      </div>
      <label>{this.props.label}</label>
    </div>`