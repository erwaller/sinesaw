React = require 'react/addons'
SizeMeasurable = require './mixins/size_measurable'

module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin, SizeMeasurable]

  getPath: (sampleData, resolution, sliceSize, windowStart, fromSlice, toSlice) ->

    points = []

    points.push "#{fromSlice * @state.width / resolution} #{@state.height}"

    for i in [fromSlice..toSlice]
      sliceStart = i * sliceSize + windowStart
      sliceEnd = sliceStart + sliceSize

      x = i * @state.width / resolution

      y = 0
      for j in [Math.floor(sliceStart)...Math.floor(sliceEnd)]
        v = Math.abs sampleData[j]
        y = v if v > y
      y = ((1 - y) * @state.height) || 0

      points.push "#{x} #{y}"

    points.push "#{x} #{@state.height}"

    "M #{points.join ' L '}"

  render: ->
    
    resolution = @state.width

    if @props.sampleData? and resolution > 0
      
      sampleData = @props.sampleData
      windowSize = Math.max 1, Math.floor @props.windowSize * sampleData.length
      windowStart = Math.floor @props.windowCenter * sampleData.length - windowSize / 2
      sliceSize = windowSize / resolution

      selectionStart = Math.floor (@props.selectionStart * sampleData.length - windowStart) / sliceSize
      selectionEnd = resolution

      console.log selectionStart

      if selectionStart > 1
        preSelection = <path d={@getPath sampleData, resolution, sliceSize, windowStart, 0, selectionStart}/>
  
      if selectionStart != selectionEnd
        selection = <path className="selection" d={@getPath sampleData, resolution, sliceSize, windowStart, selectionStart, selectionEnd}/>
      
      if selectionEnd < resolution
        postSelection = <path d={@getPath sampleData, resolution, sliceSize, windowStart, selectionEnd, resolution}/>

    <div className="ui waveform" ref="container">
      <svg width={@state.width} height={@state.height}>
        {preSelection}
        {selection}
        {postSelection}
      </svg>
    </div>