###* @jsx React.DOM ###

EnvelopeHandle = React.createClass

@Envelope = React.createClass

  mixins: [SizeMeasurable, Draggable]

  getInitialState: ->
    dragTarget: null

  getDefaultProps: ->
    dotRadius: 5
    margin: 4

  buildLines: ->
    lines = []
    dots = []
    m = @props.margin + @props.dotRadius
    w = @state.width - 2 * m
    h = @state.height - 2 * m
    env = @props.env

    p1 =
      x: 0
      y: h
    
    p2 =
      x: w / 3 * env.a
      y: 0
    
    p3 =
      x: p2.x + w / 3 * env.d
      y: h * (1 - env.s)
    
    p4 =
      x: w * 2 / 3
      y: h * (1 - env.s)
    
    p5 =
      x: w * (2 + env.r) / 3
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
    @initialValue = @props.env.a
    @setState dragTarget: 'attack'
    @draggableOnMouseDown e

  onMouseDownDecay: (e) ->
    @initialValue = {d: @props.env.d, s: @props.env.s}
    @setState dragTarget: 'decay'
    @draggableOnMouseDown e

  onMouseDownRelease: (e) ->
    @initialValue = @props.env.r
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

    env = {}
    for k, v of @props.env
      env[k] = changes[k] or v
    @props.onChange env

  onDragEnd: ->
    @initialValue = null
    @setState dragTarget: null

  update: (attr) ->
    (value) =>
      env = {}
      for k, v of @props.env
        env[k] = if k == attr then value else v
      @props.onChange env

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
          <Knob label='Attack' value={this.props.env.a} onChange={this.update('a')}/>
          <Knob label='Decay' value={this.props.env.d} onChange={this.update('d')}/>
        </div>
        <div className='group'>
          <Knob label='Sustain' value={this.props.env.s} onChange={this.update('s')}/>
          <Knob label='Release' value={this.props.env.r} onChange={this.update('r')}/>
        </div>
      </div>
      <label>{this.props.label}</label>
    </div>`