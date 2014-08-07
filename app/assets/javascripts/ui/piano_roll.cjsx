# @cjsx React.DOM

React = require 'react/addons'
SizeMeasurable = require './mixins/size_measurable'
Updatable = require './mixins/updatable'
Modelable = require './mixins/modelable'
Draggable = require './mixins/draggable'
ScaleHandle = require './scale_handle'
Keyboard = require '../util/keyboard'
Cursor = require '../util/cursor'

keyPattern = [true, false, true, false, true, true, false, true, false, true, false, true]



Keys = React.createClass
  
  mixins: [React.addons.PureRenderMixin]

  propTypes:
    height: React.PropTypes.number.isRequired
    yScroll: React.PropTypes.number.isRequired
    yScale: React.PropTypes.number.isRequired
    keyWidth: React.PropTypes.number.isRequired
    lineWidth: React.PropTypes.number.isRequired

  render: ->

    console.log 'keys rendering'

    height = @props.height
    keyHeight = height / @props.yScale
    keyWidth = @props.keyWidth - @props.lineWidth

    els = []

    minRow = @props.yScroll
    maxRow = minRow + @props.yScale
    rows = [minRow...maxRow]

    # keys
    for row, i in rows
      unless keyPattern[row % 12]
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

    <div className='keys'>
      <svg width={keyWidth} height={height} onClick={@props.onClick}>
        {els}
      </svg>
    </div>



GridLines = React.createClass

  mixins: [React.addons.PureRenderMixin]

  propTypes:
    width: React.PropTypes.number.isRequired
    height: React.PropTypes.number.isRequired
    yScale: React.PropTypes.number.isRequired
    xScale: React.PropTypes.number.isRequired
    yScroll: React.PropTypes.number.isRequired
    xScroll: React.PropTypes.number.isRequired
    quantization: React.PropTypes.number.isRequired

  render: ->
    console.log 'grid lines rendering'

    width = @props.width
    height = @props.height
    squareHeight = height / @props.yScale
    quantization = @props.quantization
    cols = @props.xScale * quantization
    squareWidth = width / cols

    els = []

    minRow = @props.yScroll
    maxRow = minRow + @props.yScale
    rows = [minRow...maxRow]
    
    minCol = @props.xScroll * quantization
    maxCol = minCol + @props.xScale * quantization
    cols = [minCol...maxCol]

    # row shading
    for row, i in rows
      unless keyPattern[row % 12]
        y = height - (i + 1) * squareHeight
        els.push <rect key={'s'+i} x={0} y={y} width={width} height={squareHeight} className='shade'/>

    # horizontal lines
    for row, i in rows
      unless (128 - row) % 12 == 0
        y = i * squareHeight
        els.push <line key={'h'+i} x1={0} y1={y} x2={width} y2={y}/>

    # vertical lines
    for col, i in cols
      unless col % quantization == 0
        x = i * squareWidth
        els.push <line key={'v'+i} x1={x} y1={0} x2={x} y2={height}/>

    # strong horizontal lines
    for row, i in rows
      if (128 - row) % 12 == 0
        y = i * squareHeight
        els.push <line key={'hs'+i} x1={0} y1={y} x2={width} y2={y} className='strong'/>

    # strong vertical lines
    for col, i in cols
      if col % quantization == 0
        x = i * squareWidth
        els.push <line key={'vs'+i} x1={x} y1={0} x2={x} y2={height} className='strong'/>

    <g>{els}</g>



PlaybackMarker = React.createClass

  mixins: [React.addons.PureRenderMixin]

  propTypes:
    position: React.PropTypes.number.isRequired
    loopSize: React.PropTypes.number.isRequired
    width: React.PropTypes.number.isRequired
    height: React.PropTypes.number.isRequired
    xScale: React.PropTypes.number.isRequired
    xScroll: React.PropTypes.number.isRequired
    quantization: React.PropTypes.number.isRequired

  render: ->

    console.log 'playback marker rendering'

    width = @props.width
    height = @props.height
    position = @props.position % @props.loopSize
    cols = @props.xScale * @props.quantization
    squareWidth = width / cols

    if position >= @props.xScroll and position <= @props.xScroll + @props.xScale
      x = Math.floor(position * @props.quantization) * squareWidth
      el = <line key='pb' x1={x} y1={0} x2={x} y2={height} className='playback'/>
    
    <g>{el}</g>



Selection = React.createClass
  
  mixins: [React.addons.PureRenderMixin]

  propTypes:
    selectionOrigin: React.PropTypes.object
    selectionPosition: React.PropTypes.object
    width: React.PropTypes.number.isRequired
    height: React.PropTypes.number.isRequired
    yScale: React.PropTypes.number.isRequired
    xScale: React.PropTypes.number.isRequired
    yScroll: React.PropTypes.number.isRequired
    xScroll: React.PropTypes.number.isRequired
    quantization: React.PropTypes.number.isRequired

  render: ->
    width = @props.width
    height = @props.height
    selectionOrigin = @props.selectionOrigin
    selectionPosition = @props.selectionPosition
    squareHeight = height / @props.yScale
    quantization = @props.quantization
    cols = @props.xScale * quantization
    squareWidth = width / cols

    if selectionOrigin? and selectionPosition?
      fromKey = Math.max selectionOrigin.key, selectionPosition.key
      keyWidth = Math.abs selectionOrigin.key - selectionPosition.key
      fromBeat =  Math.min selectionOrigin.start, selectionPosition.start
      beatWidth = Math.abs selectionOrigin.start - selectionPosition.start
      x = (fromBeat - @props.xScroll) * quantization * squareWidth
      y = (@props.yScale + @props.yScroll - fromKey - 1) * squareHeight
      w = (beatWidth * quantization + 1) * squareWidth
      h = (keyWidth + 1) * squareHeight
      el = <rect className='selection' key='sel' x={x} y={y} width={w} height={h}/>

    <g>{el}</g>



Notes = React.createClass

  mixins: [React.addons.PureRenderMixin]

  propTypes:
    notes: React.PropTypes.object.isRequired
    selectedNotes: React.PropTypes.array.isRequired
    dragOriginalValues: React.PropTypes.object
    translateTarget: React.PropTypes.number
    resizeTarget: React.PropTypes.number
    width: React.PropTypes.number.isRequired
    height: React.PropTypes.number.isRequired
    lineWidth: React.PropTypes.number.isRequired
    yScale: React.PropTypes.number.isRequired
    xScale: React.PropTypes.number.isRequired
    yScroll: React.PropTypes.number.isRequired
    xScroll: React.PropTypes.number.isRequired
    quantization: React.PropTypes.number.isRequired
    onMouseDown: React.PropTypes.func
    onMouseMove: React.PropTypes.func
    onMouseOut: React.PropTypes.func
    onClick: React.PropTypes.func
    onDoubleClick: React.PropTypes.func

  noteOnScreen: (note) ->
    note.start <= @props.xScroll + @props.xScale and
    note.start + note.length >= @props.xScroll and
    note.key >= @props.yScroll and
    note.key <= @props.yScroll + @props.yScale

  render: ->
    width = @props.width
    height = @props.height
    squareHeight = height / @props.yScale
    quantization = @props.quantization
    cols = @props.xScale * quantization
    squareWidth = width / cols

    els = []

    minRow = @props.yScroll
    maxRow = minRow + @props.yScale
    rows = [minRow...maxRow]
    
    minCol = @props.xScroll * quantization
    maxCol = minCol + @props.xScale * quantization
    cols = [minCol...maxCol]

    # ghost notes
    if @props.translateTarget? and Keyboard.pressed[18]
      for id, note of @props.dragOriginalValue
        continue unless @noteOnScreen note

        x = (note.start - @props.xScroll) * squareWidth * quantization + @props.lineWidth / 2
        y = (@props.yScale + @props.yScroll - note.key - 1) * squareHeight + @props.lineWidth / 2
        w = squareWidth * note.length * @props.quantization - @props.lineWidth
        h = squareHeight - @props.lineWidth

        els.push(
          <rect
            className="ghost note"
            key={'g' + id}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={@props.lineWidth}
            ry={@props.lineWidth}
          />
        )

    # notes
    for id, note of @props.notes
      continue unless @noteOnScreen note

      x = (note.start - @props.xScroll) * squareWidth * @props.quantization + @props.lineWidth / 2
      y = (@props.yScale + @props.yScroll - note.key - 1) * squareHeight + @props.lineWidth / 2
      w = squareWidth * note.length * @props.quantization - @props.lineWidth
      h = squareHeight - @props.lineWidth

      className = 'note'
      className += ' selected' if note.id in @props.selectedNotes
      className += ' active' if @props.translateTarget == note.id or @props.resizeTarget == note.id

      els.push(
        <rect
          className={className}
          key={'n' + id}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={@props.lineWidth}
          ry={@props.lineWidth}
          data-id={id}
          onMouseDown={@props.onMouseDown}
          onMouseMove={@props.onMouseMove}
          onMouseOut={@props.onMouseOut}
          onClick={@props.onClick}
          onDoubleClick={@props.onDoubleClick}
        />
      )

    <g>{els}</g>


module.exports = React.createClass
  
  mixins: [SizeMeasurable, Updatable, Modelable('song'), Modelable('sequence'), Draggable]

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
    
    setTimeout =>
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

  render: ->
    outerStyle =
      width: @state.width + 2 * @state.scrollPadding
      height: @state.height + 2 * @state.scrollPadding

    innerStyle =
      top: @state.scrollPadding
      left: @state.scrollPadding

    gridWidth = Math.max 0, @state.width - @state.keyWidth

    <div className="ui piano-roll">
      <div className="body" ref='container' onScroll={@snapScrolling}>
        <div className="outer" style={outerStyle}>
          <div className="inner" style={innerStyle}>
            <Keys
              width={@state.keyWidth - @state.lineWidth}
              height={@state.height}
              yScroll={@state.yScroll}
              yScale={@state.yScale}
              keyWidth={@state.keyWidth}
              lineWidth={@state.lineWidth}
              onClick={@onClickKeys}
            />
            <div className='grid' ref='grid'>
              <svg
                width={gridWidth}
                height={@state.height}
                onMouseDown={@onMouseDownGrid}
                onMouseUp={@onMouseUpGrid}
                onDoubleClick={@onDoubleClickGrid}
              >
                <GridLines
                  width={gridWidth}
                  height={@state.height}
                  yScale={@state.yScale}
                  xScale={@state.xScale}
                  yScroll={@state.yScroll}
                  xScroll={@state.xScroll}
                  quantization={@state.quantization}
                />
                <PlaybackMarker
                  position={@state.position}
                  loopSize={@state.loopSize}
                  width={gridWidth}
                  height={@state.height}
                  xScroll={@state.xScroll}
                  xScale={@state.xScale}
                  quantization={@state.quantization}
                />
                <Selection
                  selectionOrigin={@state.selectionOrigin}
                  selectionPosition={@state.selectionPosition}
                  width={gridWidth}
                  height={@state.height}
                  yScale={@state.yScale}
                  xScale={@state.xScale}
                  yScroll={@state.yScroll}
                  xScroll={@state.xScroll}
                  quantization={@state.quantization}
                />
                <Notes
                  notes={@state.notes}
                  selectedNotes={@state.selectedNotes}
                  dragOriginalValues={@orignalValues}
                  translateTarget={@state.translateTarget}
                  resizeTarget={@state.resizeTarget}
                  width={gridWidth}
                  height={@state.height}
                  yScale={@state.yScale}
                  xScale={@state.xScale}
                  yScroll={@state.yScroll}
                  xScroll={@state.xScroll}
                  lineWidth={@state.lineWidth}
                  quantization={@state.quantization}
                  onMouseDown={@onMouseDownNote}
                  onMouseMove={@onMouseMoveNote}
                  onMouseOut={@onMouseOutNote}
                  onDoubleClick={@onDoubleClickNote}
                />
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
