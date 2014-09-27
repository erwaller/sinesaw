# @cjsx React.DOM

React = require 'react/addons'
SizeMeasurable = require './mixins/size_measurable'
Updatable = require './mixins/updatable'
Draggable = require './mixins/draggable'
ScaleHandle = require './scale_handle'
Keyboard = require '../util/keyboard'
Cursor = require '../util/cursor'

Keys = require './piano_roll/keys'
GridLines = require './piano_roll/grid_lines'
Notes = require './piano_roll/notes'
PlaybackMarker = require './piano_roll/playback_marker'
Selection = require './piano_roll/selection'


module.exports = React.createClass
  
  mixins: [SizeMeasurable, Updatable, Draggable]

  getInitialState: ->
    # x scale and scroll values are in beats
    # y scale and scroll values are in half steps
    
    # x and y scale and scroll are set after component mounts based on
    # sequence property and size of element on screen
    xScale: 1
    yScale: 12
    xScroll: 0
    yScroll: 0
    
    # min and max scales of viewport
    minXScale: 1
    maxXScale: 64
    minYScale: 12
    maxYScale: 128

    # distance around the element used to measure scrolling, should be
    # more than the maximum possible distance travelled between scroll events
    scrollPadding: 500

    # should match the $line-width and $margin sass variables
    lineWidth: 1.5

    # width of key markers
    keyWidth: 40

    # moved notes will be quantized to this fraction of a note
    quantization: 4

    # maximum width from the left/right edge of a note where a drag will resize
    # rather than translate the note
    resizeHandleWidth: 10

    # state used during selection / resize / translate actions
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
    if nextProps.sequence.deref() != @props.sequence.deref()
      @autoScaleViewport nextProps.sequence

  snapScrolling: (e) ->
    e.preventDefault()
    e.stopPropagation()

    el = e.target
    xQuantum = @state.width / @state.xScale / @state.quantization
    yQuantum = @state.height / @state.yScale
    loopSize = @props.sequence.get 'loopSize'

    # update scroll deltas
    @scrollDeltaX += el.scrollLeft - @state.scrollPadding
    @scrollDeltaY += @state.scrollPadding - el.scrollTop
    
    # prevent scroll
    el.scrollTop = el.scrollLeft = @state.scrollPadding
    
    # get updated scroll state
    if Math.abs(@scrollDeltaX) > xQuantum
      quanta = (if @scrollDeltaX > 0 then Math.floor else Math.ceil)(@scrollDeltaX / xQuantum)
      @scrollDeltaX -= quanta * xQuantum
      xScroll = Math.min Math.max(0, @state.xScroll + quanta / @state.quantization), loopSize - @state.xScale

    if Math.abs(@scrollDeltaY) > yQuantum
      quanta = (if @scrollDeltaX > 0 then Math.floor else Math.ceil)(@scrollDeltaY / yQuantum)
      @scrollDeltaY -= quanta * yQuantum
      yScroll = Math.min Math.max(0, @state.yScroll + quanta), 128 - @state.yScale

    # apply changes
    if xScroll? or yScroll?
      @setState
        xScroll: if xScroll? then xScroll else @state.xScroll
        yScroll: if yScroll? then yScroll else @state.yScroll

  autoScaleViewport: (sequence) ->
    return unless sequence?

    minKey = 128
    maxKey = 0

    sequence.get('notes').forEach (id, {key}) ->
      minKey = key if key < minKey
      maxKey = key if key > maxKey

    size = Math.max(@state.minYScale, maxKey - minKey) + 12

    @setState
      xScroll: 0
      xScale: sequence.get 'loopSize'
      yScroll: Math.max 0, Math.ceil (minKey + maxKey - size) / 2
      yScale: size

  updateLoopSize: (e) ->
    # value = parseFloat e.target.value
    # @props.sequence.set loopSize: value
    # @setState xScale: value

  updateQuantization: (e) ->
    value = parseFloat e.target.value
    @setState quantization: value

  updateXScale: (scale) ->
    loopSize = @props.sequence.get 'loopSize'
    xScale = Math.round(scale * @state.quantization) / @state.quantization
    xScale = Math.min loopSize, xScale

    xScroll = Math.min @state.xScroll, loopSize - xScale

    @setState {xScale, xScroll}

  updateYScale: (scale) ->
    yScale = Math.round scale

    yScroll = Math.min @state.yScroll, 128 - @state.yScale

    @setState {yScale, yScroll}


  #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  # this should be refactored to 'updateNotes: (ids, delta) ->' so that notes
  # can move as far as possible when you attempt to move an octave near the edge
  #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  updateNotes: (changes) ->
    # notes = Object.keys(changes).map (i) =>
    #   key: if changes[i].key? then changes[i].key else @state.notes[i].key
    #   start: if changes[i].start? then changes[i].start else @state.notes[i].start
    #   length: if changes[i].length? then changes[i].length else @state.notes[i].length

    # keys = notes.map (note) -> note.key
    # starts = notes.map (note) -> note.start
    # ends = notes.map (note) -> note.start + note.length

    # minKey = Math.min.apply null, keys
    # maxKey = Math.max.apply null, keys
    # minStart = Math.min.apply null, starts
    # maxEnd = Math.max.apply null, ends

    # # prevent notes from being moved out of the available range

    # return false if minKey < 0 or maxKey > 127
    # return false if minStart < 0 or maxEnd > @state.loopSize

    # # update scroll so notes remain on screen

    # stateChanges = {}

    # if minKey < @state.yScroll and maxKey <= @state.yScroll + @state.yScale
    #   stateChanges.yScroll = minKey

    # if maxKey >= @state.yScroll + @state.yScale and minKey > @state.yScroll
    #   stateChanges.yScroll = maxKey - @state.yScale + 1

    # if minStart < @state.xScroll and maxEnd <= @state.xScroll + @state.xScale
    #   stateChanges.xScroll = minStart

    # if maxEnd >= @state.xScroll + @state.xScale and minStart > @state.xScroll
    #   stateChanges.xScroll = maxEnd - @state.xScale

    # @props.sequence.updateNotes changes
    # @setState stateChanges

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
    minEnd = Math.min from.start, to.start
    maxStart = Math.max from.start, to.start

    notes = []
    @props.sequence.get('notes').forEach (id, note) ->
      notes.push parseInt id if (
        note.key >= minKey and
        note.key <= maxKey and
        note.start + note.length > minEnd and
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
    # @props.sequence.addNote note

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

    # cache original values of selected notes
    @originalValue = @props.sequence.get('notes').filter (note, id) ->
      selectedNotes.indexOf(id) >= 0

    @dragOrigin = @props.sequence.getIn ['notes', id]

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

      @updateNotes notes


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
        distance = if Keyboard.pressed[16] then 12 else 1
        changes[id] = key: note.key + distance

      # right arrow
      else if e.keyCode is 39
        changes[id] = start: note.start + 1 / @state.quantization

      # down arrow
      else if e.keyCode is 40
        distance = if Keyboard.pressed[16] then 12 else 1
        changes[id] = key: note.key - distance

    @updateNotes changes

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
                  position={@props.song.get 'position'}
                  loopSize={@props.sequence.get 'loopSize'}
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
                  notes={@props.sequence.get 'notes'}
                  selectedNotes={@state.selectedNotes}
                  dragOriginalValue={@originalValue}
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
            <option value="3">1/3</option>
            <option value="4">1/4</option>
            <option value="6">1/6</option>
            <option value="8">1/8</option>
            <option value="12">1/12</option>
            <option value="16">1/16</option>
          </select>
        </div>
        <div className="setting">
          <label>Length</label>
          <select value={@props.sequence.get 'loopSize'} onChange={@updateLoopSize}>
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
