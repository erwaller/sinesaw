###* @jsx React.DOM ###

@PianoRoll = React.createClass
  
  mixins: [SizeMeasurable, Updatable]

  keyPattern: [true, false, true, false, true, true, false, true, false, true, false, true]

  getInitialState: ->
    xScale: 1
    yScale: 3
    minXScale: 1
    maxXScale: 8
    minYScale: 2
    maxYScale: 12
    keyWidth: 40
    lineWidth: 2
    loopSize: 8
    quantization: 4

  componentDidMount: ->
    @previousScrollY = @refs.container.getDOMNode().scrollTop
    @previousScrollX = @refs.grid.getDOMNode().scrollLeft
    @scrollDeltaY = 0
    @scrollDeltaX = 0

  snapYScrolling: (e) ->
    yQuantum = @state.height * @state.yScale / 128
    yScroll = Math.round((e.target.scrollTop + @scrollDeltaY) / yQuantum) * yQuantum
    
    # handle weirdness when height is not an integral number of quanta
    if e.target.scrollTop + @scrollDeltaY >= @state.height * (@state.yScale - 1) - yQuantum
      e.target.scrollTop = 99999
      @scrollDeltaY = 1 - yQuantum if @scrollDeltaY > 1 - yQuantum
    
    else if yScroll != @previousScrollY
      e.target.scrollTop = yScroll
      @previousScrollY = yScroll
      @scrollDeltaY = 0
    else
      @scrollDeltaY += (e.target.scrollTop - @previousScrollY)
      e.target.scrollTop = @previousScrollY

  snapXScrolling: (e) ->
    xQuantum = (@state.width * @state.xScale - @state.keyWidth) / @state.loopSize / Math.max(@state.quantization, 16)
    xScroll = Math.round((e.target.scrollLeft + @scrollDeltaX) / xQuantum) * xQuantum

    if xScroll != @previousScrollX
      e.target.scrollLeft = xScroll
      @previousScrollX = xScroll
      @scrollDeltaX = 0
    else
      @scrollDeltaX += (e.target.scrollLeft - @previousScrollX)
      e.target.scrollLeft = @previousScrollX

  buildKeys: ->
    height = @state.height * @state.yScale
    keyHeight = height / 128
    keyWidth = @state.keyWidth - @state.lineWidth

    els = []

    # keys
    for i in [0...128]
      unless @keyPattern[i % 12]
        y = height - (i + 1) * keyHeight
        text = null
        els.push `<rect key={'k' + i} x={0} y={y} width={keyWidth} height={keyHeight}/>`

    # lines
    for i in [1...128]
      y = i * keyHeight
      els.push `<line key={'l' + i} x1={0} y1={y} x2={keyWidth} y2={y}/>`

    # text
    for i in [0...128]
      if i % 12 == 0
        y = height - (i + 0.5) * keyHeight
        text = "C #{Math.floor(i / 12) - 2}"
        els.push `<text key={'t' + i} x={keyWidth - 4} y={y}>{text}</text>`

    els

  buildGrid: ->
    width = @state.width * @state.xScale - @state.keyWidth
    height = @state.height * @state.yScale
    squareHeight = height / 128
    cols = @state.loopSize * @state.quantization
    squareWidth = width / cols

    els = []

    # row shading
    for i in [0...128]
      unless @keyPattern[i % 12]
        y = height - (i + 1) * squareHeight
        els.push `<rect key={'s'+i} x={0} y={y} width={width} height={squareHeight} className='shade'/>`

    # horizontal lines
    for i in [1...128]
      unless (128 - i) % 12 == 0
        y = i * squareHeight
        els.push `<line key={'h'+i} x1={0} y1={y} x2={width} y2={y}/>`

    # vertical lines
    for i in [1...cols]
      unless i % @state.quantization == 0
        x = i * squareWidth
        els.push `<line key={'v'+i} x1={x} y1={0} x2={x} y2={height}/>`

    # strong horizontal lines
    for i in [1...128]
      if (128 - i) % 12 == 0
        y = i * squareHeight
        els.push `<line key={'hs'+i} x1={0} y1={y} x2={width} y2={y} className='strong'/>`

    # strong vertical lines
    for i in [1...cols]
      if i % @state.quantization == 0
        x = i * squareWidth
        els.push `<line key={'vs'+i} x1={x} y1={0} x2={x} y2={height} className='strong'/>`

    els

  updateLoopSize: (e) ->
    @setState loopSize: e.target.value

  updateQuantization: (e) ->
    @setState quantization: e.target.value

  render: ->
    if @state.width > 0
      keys = @buildKeys()
      grid = @buildGrid()
      notes = []

    `<div className="ui piano-roll">
      <div className="body" ref='container' onScroll={this.snapYScrolling}>
        <div className='keys'>
          <svg
            width={this.state.keyWidth - this.state.lineWidth}
            height={this.state.height * this.state.yScale}
          >
            {keys}
          </svg>
        </div>
        <div className='grid' ref='grid' onScroll={this.snapXScrolling}>
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
        <div className="setting">
          <label>Grid</label>
          <select value={this.state.quantization} onChange={this.updateQuantization}>
            <option value="1">1</option>
            <option value="2">1/2</option>
            <option value="4">1/4</option>
            <option value="8">1/8</option>
            <option value="16">1/16</option>
          </select>
        </div>
        <div className="setting">
          <label>Length</label>
          <select value={this.state.loopSize} onChange={this.updateLoopSize}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>
        <ScaleHandle min={this.state.minYScale} max={this.state.maxYScale} value={this.state.yScale} onChange={this.update('yScale')}>
          <span className="icon icon-arrow-up"/>
          <span className="icon icon-arrow-down"/>
        </ScaleHandle>
        <ScaleHandle min={this.state.minXScale} max={this.state.maxXScale} value={this.state.xScale} onChange={this.update('xScale')}>
          <span className="icon icon-arrow-left"/>
          <span className="icon icon-arrow-right"/>
        </ScaleHandle>
      </div>
    </div>`