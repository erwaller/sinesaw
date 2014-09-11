React = require 'react/addons'
SizeMeasurable = require './mixins/size_measurable'

module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin, SizeMeasurable]

  render: ->
    
    resolution = @state.width

    if @props.sampleData?
      
      sampleData = @props.sampleData
      windowSize = Math.max 1, Math.floor @props.windowSize * sampleData.length
      windowStart = Math.floor @props.windowCenter * sampleData.length - windowSize / 2
      sliceSize = windowSize / resolution
      
      points = []

      points.push x: 0, y: @state.height

      for i in [1...resolution]
        sliceStart = i * sliceSize + windowStart
        sliceEnd = sliceStart + sliceSize

        x = (i + 0.5) * @state.width / (resolution + 1)

        y = 0
        for j in [Math.floor(sliceStart)...Math.floor(sliceEnd)]
          v = Math.abs sampleData[j]
          y = v if v > y
        y = ((1 - y) * @state.height) || 0

        points.push {x,y}

      points.push x: @state.width, y: @state.height

      path = <path key="p" d={'M ' + points.map((p) -> "#{p.x} #{p.y}").join ' L '}/>

      <div className="ui waveform" ref="container">
        <svg width={@state.width} height={@state.height}>
          {path}
        </svg>
      </div>