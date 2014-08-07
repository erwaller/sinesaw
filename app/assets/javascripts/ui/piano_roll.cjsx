# @cjsx React.DOM

React = require 'react'
SizeMeasurable = require './mixins/size_measurable'
Updatable = require './mixins/updatable'
Modelable = require './mixins/modelable'
Draggable = require './mixins/draggable'
ScaleHandle = require './scale_handle'
Keyboard = require '../util/keyboard'
Cursor = require '../util/cursor'

module.exports = React.createClass
  
  mixins: [SizeMeasurable, Updatable, Modelable('song'), Modelable('sequence'), Draggable]

  keyPattern: [true, false, true, false, true, true, false, true, false, true, false, true]

  getInitialState: ->
    # x scale and scroll values are in beats
    # x scale and scroll values are in half steps
    xScale: 4
    yScale: 28
    minXScale: 1
    maxXScale: 64
    minYScale: 12
    maxYScale: 128
    xScroll: 0
    yScroll: 50
    keyWidth: 60
    lineWidth: 1
    scrollPadding: 500
    quantization: 4
    resizeHandleWidth: 10
    selectedNotes: []
    selectionOrigin: null
    selectionPosition: null
    resizeTarget: null
    resizeDirection: null
    translateTarget: null

  componentDidMount: ->
    el = @refs.container.getDOMNode()
    el.scrollTop = @state.scrollPadding
    el.scrollLeft = @state.scrollPadding

    Keyboard.on 8, @deleteSelectedNotes
    Keyboard.on 37, @onArrowKey
    Keyboard.on 38, @onArrowKey
    Keyboard.on 39, @onArrowKey
    Keyboard.on 40, @onArrowKey

    @scrollDeltaY = 0
    @scrollDeltaX = 0

    @autoScaleViewport @props.sequence

  componentWillUnmount: ->
    Keyboard.off 8, @deleteSelectedNotes
    Keyboard.off 37, @onArrowKey
    Keyboard.off 38, @onArrowKey
    Keyboard.off 39, @onArrowKey
    Keyboard.off 40, @onArrowKey

  componentWillReceiveProps: (nextProps) ->
    if nextProps.sequence != @props.sequence
      @autoScaleViewport nextProps.sequence

  snapScrolling: (e) ->
    e.preventDefault()
    e.stopPropagation()

    el = e.target
    xQuantum = @state.width / @state.xScale / @state.quantization
    yQuantum = @state.height / @state.yScale

    # update scroll deltas
    @scrollDeltaX += el.scrollLeft - @state.scrollPadding
    @scrollDeltaY += @state.scrollPadding - el.scrollTop
    
    # prevent scroll
    el.scrollTop = el.scrollLeft = @state.scrollPadding
    
    # get updated scroll state
    if Math.abs(@scrollDeltaX) > xQuantum
      quanta = (if @scrollDeltaX > 0 then Math.floor else Math.ceil)(@scrollDeltaX / xQuantum)
      @scrollDeltaX -= quanta * xQuantum
      xScroll = Math.min Math.max(0, @state.xScroll + quanta / @state.quantization), @state.loopSize - @state.xScale

    if Math.abs(@scrollDeltaY) > yQuantum
      quanta = (if @scrollDeltaX > 0 then Math.floor else Math.ceil)(@scrollDeltaY / yQuantum)
      @scrollDeltaY -= quanta * yQuantum
      yScroll = Math.min Math.max(0, @state.yScroll + quanta), 127 - @state.yScale

    # apply changes
    if xScroll? or yScroll?
      @setState
        xScroll: if xScroll? then xScroll else @state.xScroll
        yScroll: if yScroll? then yScroll else @state.yScroll

  autoScaleViewport: (sequence) ->
    minKey = 128
    maxKey = 0

    for id, {key} of sequence.state.notes
      minKey = key if key < minKey
      maxKey = key if key > maxKey

    size = Math.max(@state.minYScale, maxKey - minKey) + 8

    @setState
      xScroll: 0
      xScale: sequence.state.loopSize
      yScroll: Math.max 0, Math.ceil (minKey + maxKey - size) / 2
      yScale: size

  updateLoopSize: (e) ->
    @props.sequence.set loopSize: e.target.value
    @setState xScale: e.target.value

  updateQuantization: (e) ->
    @setState quantization: e.target.value

  updateXScale: (scale) ->
    xScale = Math.round(scale * @state.quantization) / @state.quantization
    xScale = Math.min(@state.loopSize, xScale)

    xScroll = Math.min @state.xScroll, @state.loopSize - xScale

    @setState {xScale, xScroll}

  updateYScale: (scale) ->
    yScale = Math.round scale

    yScroll = Math.min @state.yScroll, 127 - @state.yScale

    @setState {yScale, yScroll}

  getRelativePosition: ({x,y}) ->
    {top, left} = @refs.grid.getDOMNode().getBoundingClientRect()
    height = @state.height
    width = @state.width - @state.keyWidth

    key = Math.floor((height - y + top) / height * @state.yScale) + @state.yScroll
    start = Math.floor((x - left) / width * @state.xScale * @state.quantization) / @state.quantization + @state.xScroll

    {key, start}

  deleteSelectedNotes: ->
    @props.sequence.removeNotes @state.selectedNotes

  notesSelectedBy: (from, to) ->
    minKey = Math.min from.key, to.key
    maxKey = Math.max from.key, to.key
    minStart = Math.min from.start, to.start
    maxStart = Math.max from.start, to.start

    notes = []
    for id, note of @state.notes
      notes.push parseInt id if (
        note.key >= minKey and
        note.key <= maxKey and
        note.start + note.length > minStart and
        note.start <= maxStart
      )

    notes

  noteOnScreen: (note) ->
    note.start <= @state.xScroll + @state.xScale and
    note.start + note.length >= @state.xScroll and
    note.key >= @state.yScroll and
    note.key <= @state.yScroll + @state.yScale

  onClickKeys: (e) ->

  # deselect any selected notes,
  # start drag selection
  onMouseDownGrid: (e) ->
    @setState selectedNotes: [] unless Keyboard.pressed[16]

    # handle drag start 
    @draggableOnMouseDown e
    @setState selectionOrigin: @getRelativePosition {x: e.clientX, y: e.clientY}

  # add a new note
  onDoubleClickGrid: (e) ->
    {key, start} = @getRelativePosition x: e.clientX, y: e.clientY
    note = {key, start, length: 1 / @state.quantization}
    @props.sequence.addNote note

  # change cursor to indicate possible action
  onMouseMoveNote: (e) ->
    position = e.target.getBoundingClientRect()

    handleSize = Math.max 0, Math.min @state.resizeHandleWidth, (position.width - @state.resizeHandleWidth) / 2

    if position.left > e.clientX - handleSize
      @noteHoverCursor = Cursor.set 'w-resize', 1, @noteHoverCursor
    else if position.right < e.clientX + handleSize
      @noteHoverCursor = Cursor.set 'e-resize', 1, @noteHoverCursor
    else
      Cursor.clear @noteHoverCursor

  onMouseOutNote: (e) ->
    Cursor.clear @noteHoverCursor

  onMouseDownNote: (e) ->
    e.stopPropagation()
    id = parseInt e.target.dataset.id
    position = e.target.getBoundingClientRect()

    # handle note selection
    if Keyboard.pressed[16]
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

    stateChanges = {selectedNotes}

    # handle drag start
    @draggableOnMouseDown e

    @originalValue = {}
    for i in selectedNotes
      @originalValue[i] = @state.notes[i]

    @dragOrigin = @state.notes[id]
    

    handleSize = Math.max 0, Math.min @state.resizeHandleWidth, (position.width - @state.resizeHandleWidth) / 2

    # handle resize
    if position.left > e.clientX - handleSize
      stateChanges.resizeTarget = id
      stateChanges.resizeDirection = 'left'
      @dragActionCursor = Cursor.set 'w-resize', 2, @dragActionCursor
    else if position.right < e.clientX + handleSize
      stateChanges.resizeTarget = id
      stateChanges.resizeDirection = 'right'
      @dragActionCursor = Cursor.set 'e-resize', 2, @dragActionCursor
    # handle translate
    else 
      stateChanges.translateTarget = id
      @dragActionCursor = Cursor.set 'move', 2, @dragActionCursor

    # apply state changes
    @setState stateChanges

  # remove the double clicked note
  onDoubleClickNote: (e) ->
    e.stopPropagation()
    @props.sequence.removeNote e.target.dataset.id

  onDrag: (delta, e) ->

    position = @getRelativePosition x: e.clientX, y: e.clientY

    # handle drag selection
    if @state.selectionOrigin?
      @setState selectionPosition: position
    
    else 
      keyDelta = position.key - @dragOrigin.key
      startDelta = position.start - @dragOrigin.start
      notes = {}

      # handle translation of notes
      if @state.translateTarget?
        for i, note of @originalValue
          notes[i] =
            key: note.key + keyDelta
            start: note.start + startDelta

      # handle resize of notes
      if @state.resizeTarget?
        minLength = 1 / @state.quantization

        if @state.resizeDirection == 'right'
          for i, note of @originalValue
            notes[i] = length: Math.max minLength, note.length + startDelta - @dragOrigin.length + minLength

        if @state.resizeDirection == 'left'
          for i, note of @originalValue
            start = note.start + startDelta
            start = Math.max 0, start
            start = Math.min start, note.start + note.length - minLength
            notes[i] =
              start: start
              length: note.start + note.length - start

      @props.sequence.updateNotes notes


  onDragEnd: (e) ->
    # if the alt key is held, copy notes
    @props.sequence.addNotes @originalValue if @originalValue? and Keyboard.pressed[18]

    changes =
      translateTarget: null
      resizeTarget: null
      resizeDirection: null
      selectionOrigin: null
      selectionPosition: null

    # handle drag select
    if @state.selectionOrigin?
      position = @getRelativePosition x: e.clientX, y: e.clientY
      selectedNotes = @notesSelectedBy @state.selectionOrigin, position
      selectedNotes = @state.selectedNotes.slice(0).concat selectedNotes if Keyboard.pressed[16]
      changes.selectedNotes = selectedNotes

    @setState changes

    @originalValue = null
    @dragOrigin = null

    Cursor.clear @dragActionCursor


  onArrowKey: (e) ->
    changes = {}

    for id in @state.selectedNotes

      note = @state.notes[id]

      # left arrow
      if e.keyCode is 37
        changes[id] = start: note.start - 1 / @state.quantization

      # up arrow
      else if e.keyCode is 38
        changes[id] = key: note.key + 1

      # right arrow
      else if e.keyCode is 39
        changes[id] = start: note.start + 1 / @state.quantization

      # down arrow
      else if e.keyCode is 40
        changes[id] = key: note.key - 1

    @props.sequence.updateNotes changes


  buildKeys: ->
    height = @state.height
    keyHeight = height / @state.yScale
    keyWidth = @state.keyWidth - @state.lineWidth

    els = []

    minRow = @state.yScroll
    maxRow = minRow + @state.yScale
    rows = [minRow...maxRow]

    # keys
    for row, i in rows
      unless @keyPattern[row % 12]
        y = height - (i + 1) * keyHeight
        text = null
        els.push <rect key={'k' + i} x={0} y={y} width={keyWidth} height={keyHeight}/>

    # lines
    for row, i in rows
      y = i * keyHeight
      els.push <line key={'l' + i} x1={0} y1={y} x2={keyWidth} y2={y}/>

    # text
    for row, i in rows
      if row % 12 == 0
        y = height - (i + 0.5) * keyHeight
        text = "C #{Math.floor(row / 12) - 2}"
        els.push <text key={'t' + i} x={keyWidth - 4} y={y}>{text}</text>

    els

  buildGrid: ->
    width = @state.width - @state.keyWidth
    height = @state.height
    squareHeight = height / @state.yScale
    cols = @state.xScale * @state.quantization
    squareWidth = width / cols

    els = []

    minRow = @state.yScroll
    maxRow = minRow + @state.yScale
    rows = [minRow...maxRow]
    
    minCol = @state.xScroll * @state.quantization
    maxCol = minCol + @state.xScale * @state.quantization
    cols = [minCol...maxCol]

    # row shading
    for row, i in rows
      unless @keyPattern[row % 12]
        y = height - (i + 1) * squareHeight
        els.push <rect key={'s'+i} x={0} y={y} width={width} height={squareHeight} className='shade'/>

    # horizontal lines
    for row, i in rows
      unless (128 - row) % 12 == 0
        y = i * squareHeight
        els.push <line key={'h'+i} x1={0} y1={y} x2={width} y2={y}/>

    # vertical lines
    for col, i in cols
      unless col % @state.quantization == 0
        x = i * squareWidth
        els.push <line key={'v'+i} x1={x} y1={0} x2={x} y2={height}/>

    # strong horizontal lines
    for row, i in rows
      if (128 - row) % 12 == 0
        y = i * squareHeight
        els.push <line key={'hs'+i} x1={0} y1={y} x2={width} y2={y} className='strong'/>

    # strong vertical lines
    for col, i in cols
      if col % @state.quantization == 0
        x = i * squareWidth
        els.push <line key={'vs'+i} x1={x} y1={0} x2={x} y2={height} className='strong'/>

    # playback marker
    position = @state.position % @state.loopSize
    if position >= @state.xScroll and position <= @state.xScroll + @state.xScale
      x = Math.floor(position * @state.quantization) * squareWidth
      els.push <line key='pb' x1={x} y1={0} x2={x} y2={height} className='playback'/>

    # selection
    if @state.selectionOrigin? and @state.selectionPosition?
      fromKey = Math.max @state.selectionOrigin.key, @state.selectionPosition.key
      keyWidth = Math.abs @state.selectionOrigin.key - @state.selectionPosition.key
      fromBeat =  Math.min @state.selectionOrigin.start, @state.selectionPosition.start
      beatWidth = Math.abs @state.selectionOrigin.start - @state.selectionPosition.start
      x = (fromBeat - @state.xScroll) * @state.quantization * squareWidth
      y = (@state.yScale + @state.yScroll - fromKey - 1) * squareHeight
      w = (beatWidth * @state.quantization + 1) * squareWidth
      h = (keyWidth + 1) * squareHeight
      els.push(
        <rect
          className='selection'
          key='sel'
          x={x}
          y={y}
          width={w}
          height={h}
        />
      )

    # ghost notes
    if @state.translateTarget? and Keyboard.pressed[18]
      for id, note of @originalValue
        continue unless @noteOnScreen note

        x = (note.start - @state.xScroll) * squareWidth * @state.quantization + @state.lineWidth / 2
        y = (@state.yScale + @state.yScroll - note.key - 1) * squareHeight + @state.lineWidth / 2
        w = squareWidth * note.length * @state.quantization - @state.lineWidth
        h = squareHeight - @state.lineWidth

        els.push(
          <rect
            className="ghost note"
            key={'g' + id}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={@state.lineWidth}
            ry={@state.lineWidth}
          />
        )

    # notes
    for id, note of @state.notes
      continue unless @noteOnScreen note

      x = (note.start - @state.xScroll) * squareWidth * @state.quantization + @state.lineWidth / 2
      y = (@state.yScale + @state.yScroll - note.key - 1) * squareHeight + @state.lineWidth / 2
      w = squareWidth * note.length * @state.quantization - @state.lineWidth
      h = squareHeight - @state.lineWidth

      className = 'note'
      className += ' selected' if note.id in @state.selectedNotes
      className += ' active' if @state.translateTarget == note.id or @state.resizeTarget == note.id

      els.push(
        <rect
          className={className}
          key={'n' + id}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={@state.lineWidth}
          ry={@state.lineWidth}
          data-id={id}
          onMouseDown={@onMouseDownNote}
          onMouseMove={@onMouseMoveNote}
          onMouseOut={@onMouseOutNote}
          onClick={@onClickNote}
          onDoubleClick={@onDoubleClickNote}
        />
      )

    els

  render: ->
    if @state.width > 0
      keys = @buildKeys()
      grid = @buildGrid()

    outerStyle =
      width: @state.width + 2 * @state.scrollPadding
      height: @state.height + 2 * @state.scrollPadding

    innerStyle =
      top: @state.scrollPadding
      left: @state.scrollPadding

    <div className="ui piano-roll">
      <div className="body" ref='container' onScroll={@snapScrolling}>
        <div className="outer" style={outerStyle}>
          <div className="inner" style={innerStyle}>
            <div className='keys'>
              <svg
                width={@state.keyWidth - @state.lineWidth}
                height={@state.height}
                onClick={@onClickKeys}
              >
                {keys}
              </svg>
            </div>
            <div className='grid' ref='grid'>
              <svg
                width={Math.max(0, @state.width - @state.keyWidth)}
                height={@state.height}
                onMouseDown={@onMouseDownGrid}
                onMouseUp={@onMouseUpGrid}
                onDoubleClick={@onDoubleClickGrid}
              >
                {grid}
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="view-controls">
        <div className="setting">
          <label>Grid</label>
          <select value={@state.quantization} onChange={@updateQuantization}>
            <option value="1">1</option>
            <option value="2">1/2</option>
            <option value="4">1/4</option>
            <option value="8">1/8</option>
            <option value="16">1/16</option>
          </select>
        </div>
        <div className="setting">
          <label>Length</label>
          <select value={@state.loopSize} onChange={@updateLoopSize}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>
        <ScaleHandle min={@state.minYScale} max={@state.maxYScale} value={@state.yScale} onChange={@updateYScale}>
          <span className="icon icon-arrow-up"/>
          <span className="icon icon-arrow-down"/>
        </ScaleHandle>
        <ScaleHandle min={@state.minXScale} max={@state.maxXScale} value={@state.xScale} onChange={@updateXScale}>
          <span className="icon icon-arrow-left"/>
          <span className="icon icon-arrow-right"/>
        </ScaleHandle>
      </div>
    </div>
