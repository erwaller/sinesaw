###* @jsx React.DOM ###

@PianoRoll = React.createClass
  
  mixins: [elementSizeMixin]

  keyPattern: [true, false, true, false, true, true, false, true, false, true, false, true]

  getInitialState: ->
    xScale: 1
    yScale: 4
    keyWidth: 30
    loopSize: 4
    quantization: 1/4

  buildKeys: ->
    height = @state.height * @state.yScale
    keyHeight = height / 128

    for i in [0...128]
      y = height - (i + 1) * keyHeight
      className = if @keyPattern[i % 12] then 'white' else 'black'
      `<rect key={i} x={0} y={y} width={this.state.keyWidth} height={keyHeight} className={className}/>`

  buildGrid: ->
    width = @state.width * @state.xScale - @state.keyWidth
    height = @state.height * @state.yScale

    horizontalLines = for i in [0...129]
      y = i / 128 * height
      `<line key={'h'+i} x1={0} y1={y} x2={width} y2={y}/>`

    cols = @state.loopSize / @state.quantization
    verticalLines = for i in [0...cols]
      x = i / cols * width
      `<line key={'v'+i} x1={x} y1={0} x2={x} y2={height}/>`

    horizontalLines.concat verticalLines

  handler: (e) ->
    console.log e
    e.preventDefault()
    e.stopPropagation()

  render: ->
    if @state.height?
      keys = @buildKeys()
      grid = @buildGrid()
      notes = []

    # setTimeout(=>
    #   @refs.container.getDOMNode().addEventListener 'mousewheel', @handler
    # , 0)

    `<div className="ui piano-roll">
      <div className="body" ref='container'>
        <div className='keys'>
          <svg
            width={this.state.keyWidth + 1}
            height={this.state.height * this.state.yScale}
          >
            {keys}
          </svg>
        </div>
        <div className='grid'>
          <svg
            width={Math.max(0, this.state.width * this.state.xScale - this.state.keyWidth)}
            height={this.state.height * this.state.yScale}
          >
            {grid}
            {notes}
          </svg>
        </div>
      </div>
      <div className="view-controls">
        <div className="vetical-scale"/>
        <div className="horizontal-scale"/>
      </div>
    </div>`