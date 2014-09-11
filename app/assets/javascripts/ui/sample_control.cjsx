React = require 'react/addons'
Draggable = require './mixins/draggable'
SizeMeasurable = require './mixins/size_measurable'
Waveform = require './waveform'

decoder = new webkitAudioContext

module.exports = React.createClass

  # range in pixels for vertical drag to zoom
  range: 300
  dragTypeDistance: 10

  mixins: [React.addons.pureRenderMixin, Draggable, SizeMeasurable]

  getInitialState: ->
    windowCenter: 0.5
    windowSize: 1

  validateWindowCenter: (center) ->
    halfSize = @state.windowSize / 2

    if center < halfSize
      halfSize
    else if center > 1 - halfSize
      1 - halfSize
    else
      center

  onDragStart: ->
    @initialWindowSize = @state.windowSize
    @initialWindowCenter = @state.windowCenter
    @dragType = null

    # get sample index of initial mousdown
    relativePosition = (@dragStartPosition.x - @getDOMNode().getBoundingClientRect().left) / @state.width
    @initialPosition = @state.windowCenter + @state.windowSize * (relativePosition - 0.5)
    

  onDrag: (delta) ->
    if @dragType == 'scale'

      upRange = Math.min @range, (@dragStartPosition.y - window.scrollY)
      downRange = Math.min @range, (window.innerHeight + window.scrollY - @dragStartPosition.y)

      if delta.y < 0
        minValue = Math.min 1, @state.width / @props.sampleData.length
        size = Math.max minValue, @initialWindowSize * (downRange + delta.y) / downRange
      else
        size = Math.min 1, @initialWindowSize + (1 - @initialWindowSize) * delta.y / upRange

      center = @initialPosition - size / @initialWindowSize * (@initialPosition - @initialWindowCenter)

      @setState
        windowSize: size
        windowCenter: @validateWindowCenter center

    else if @dragType == 'pan'

      center = @initialWindowCenter + delta.x / @state.width * @initialWindowSize
      @setState windowCenter: @validateWindowCenter center

    else
      if Math.abs(delta.x) > @dragTypeDistance
        @dragType = 'pan'
      else if Math.abs(delta.y) > @dragTypeDistance
        @dragType = 'scale'

  triggerFileInput: ->
    @refs.input.getDOMNode().click()

  onFileSelect: ->
    file = @refs.input.getDOMNode().files[0]

    if file?
      reader = new FileReader
      reader.onload = (e) =>
        decoder.decodeAudioData e.target.result, (buffer) =>
          data = buffer.getChannelData 0
          @props.onChange file.name, data
      reader.readAsArrayBuffer file

  clear: ->
    console.log 'clearing'
    @props.onChange null, null

  render: ->
    <div className="ui sample-control">
      <input type="file" ref="input" onChange={@onFileSelect}/>
      <div
        className="display"
        ref="container"
        onClick={if @props.sampleData? then null else @triggerFileInput}
        onMouseDown={if @props.sampleData? then @draggableOnMouseDown else null}
      >
        {if @props.sampleData? then null else <div className="instruction">click to upload</div>}
        <Waveform
          sampleData={@props.sampleData}
          width={@state.width}
          height={@state.height}
          windowCenter={@state.windowCenter}
          windowSize={@state.windowSize}
        />
        <div className="markers">
          <div className="start" style={left: "#{100*@props.sampleStart}%", display: if @props.sampleData then 'block' else 'none'}/>
        </div>
      </div>
      <div className="controls">
        <div className="control" onClick={@triggerFileInput}>
          <div className="icon icon-arrow-up"/>
        </div>
        <div className="control">
          <div className="icon icon-record"/>
        </div>
        <div className="control" onClick={@clear}>
          <div className="icon icon-cross"/>
        </div>
        <div className="file-name">{@props.sampleName}</div>
      </div>
      <label>{@props.label}</label>
    </div>
