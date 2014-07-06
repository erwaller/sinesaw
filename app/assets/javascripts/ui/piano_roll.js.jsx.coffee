###* @jsx React.DOM ###

@PianoRoll = React.createClass
  
  mixins: [SizeMeasurable, Updatable, Modelable('song'), Modelable('sequence'), Draggable]

  keyPattern: [true, false, true, false, true, true, false, true, false, true, false, true]

  getInitialState: ->
    xScale: 1
    yScale: 5
    minXScale: 1
    maxXScale: 2
    minYScale: 1
    maxYScale: 12
    keyWidth: 40
    lineWidth: 2
    quantization: 4
    selectedNotes: []

  componentDidMount: ->
    el = @refs.container.getDOMNode()
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2

    @previousScrollY = el.scrollTop
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
    width = (@state.width - @state.keyWidth) * @state.xScale
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

    # playback marker
    x = Math.floor(@state.position % @state.loopSize * @state.quantization) * squareWidth
    els.push `<line x1={x} y1={0} x2={x} y2={height} className='playback'/>`

    # notes
    for id, note of @state.notes
      x = width / @state.loopSize * note.start + @state.lineWidth / 2
      y = height * (127 - note.key) / 128 + @state.lineWidth / 2
      w = width / @state.loopSize * note.length - @state.lineWidth
      h = squareHeight - @state.lineWidth

      className = 'note'
      className += ' selected' if note.id in @state.selectedNotes
      className += ' active' if @state.dragTarget == note.id

      els.push(
        `<rect
          className={className}
          key={'n' + id}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={this.state.lineWidth}
          ry={this.state.lineWidth}
          data-id={id}
          onMouseDown={this.onMouseDownNote}
          onClick={this.onClickNote}
          onDoubleClick={this.onDoubleClickNote}
        />`
      )

    els

  updateLoopSize: (e) ->
    @props.sequence.set loopSize: e.target.value

  updateQuantization: (e) ->
    @setState quantization: e.target.value

  getRelativePosition: ({x,y}) ->
    container = @refs.container.getDOMNode()
    top = container.getBoundingClientRect().top
    grid = @refs.grid.getDOMNode()
    left = grid.getBoundingClientRect().left
    height = @state.height * @state.yScale
    width = (@state.width - @state.keyWidth) * @state.xScale

    key = Math.round (height - container.scrollTop - (y - top)) / height * 127
    start = Math.floor(((x - left) + grid.scrollLeft) / width * @state.loopSize * @state.quantization) / @state.quantization

    {key, start}

  onClickKeys: (e) ->

  # deselect any selected notes,
  # start drag selection
  onMouseDownGrid: ->
    @setState selectedNotes: []

  # end drag selection
  onMouseUpGrid: ->

  # add a new note
  onDoubleClickGrid: (e) ->
    {key, start} = @getRelativePosition x: e.clientX, y: e.clientY
    note = {key, start, length: 1 / @state.quantization}
    @props.sequence.addNote note

  # select the clicked note
  onMouseDownNote: (e) ->
    e.stopPropagation()

    id = parseInt e.target.dataset.id

    if e.shiftKey
      selectedNotes = @state.selectedNotes.slice 0
      if id in @state.selectedNotes
        selectedNotes.splice selectedNotes.indexOf(id), 1
      else
        selectedNotes.push id
    else
      unless id in @state.selectedNotes
        selectedNotes = [id]
      else
        selectedNotes = @state.selectedNotes

    @setState {selectedNotes, dragTarget: id}

    # handle drag start
    @draggableOnMouseDown e
    @originalValue = {}
    for i in selectedNotes
      @originalValue[i] = @state.notes[i]

  # remove the double clicked note
  onDoubleClickNote: (e) ->
    e.stopPropagation()
    @props.sequence.removeNote e.target.dataset.id

  onDrag: (delta) ->
    height = @state.height * @state.yScale
    width = (@state.width - @state.keyWidth) * @state.xScale

    keyDelta = Math.round delta.y / height * 127
    startDelta = Math.round(-delta.x / width * @state.loopSize * @state.quantization) / @state.quantization

    notes = {}

    for i, note of @originalValue
      notes[i] =
        key: note.key + keyDelta
        start: note.start + startDelta

    @props.sequence.updateNotes notes

  onDragEnd: ->
    @setState dragTarget: null
    @originalValue = null

  render: ->
    if @state.width > 0
      keys = @buildKeys()
      grid = @buildGrid()

    `<div className="ui piano-roll">
      <div className="body" ref='container' onScroll={this.snapYScrolling}>
        <div className='keys'>
          <svg
            width={this.state.keyWidth - this.state.lineWidth}
            height={this.state.height * this.state.yScale}
            onClick={this.onClickKeys}
          >
            {keys}
          </svg>
        </div>
        <div className='grid' ref='grid' onScroll={this.snapXScrolling}>
          <svg
            width={Math.max(0, (this.state.width - this.state.keyWidth) * this.state.xScale)}
            height={this.state.height * this.state.yScale}
            onMouseDown={this.onMouseDownGrid}
            onMouseUp={this.onMouseUpGrid}
            onDoubleClick={this.onDoubleClickGrid}
          >
            {grid}
          </svg>
        </div>
      </div>
      <div className="view-controls">
        <div className="setting">
          <label>Grid {this.state.selectedNotes}</label>
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