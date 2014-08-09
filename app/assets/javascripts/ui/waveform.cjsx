React = require 'react/addons'
SizeMeasurable = require './mixins/size_measurable'

module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin, SizeMeasurable]

  render: ->
    
    resolution = @state.width

    if @props.sampleData?
      
      sampleData = @props.sampleData
      sliceSize = sampleData.length / resolution
      
      points = []

      points.push x: 0, y: @state.height

      for i in [1...resolution]
        sliceStart = i * sliceSize
        sliceEnd = sliceStart + sliceSize

        x = (i + 0.5) * @state.width / (resolution + 1)

        y = 0
        for j in [Math.floor(sliceStart)...Math.floor(sliceEnd)]
          y = sampleData[j] if sampleData[j] > y
        y = ((1 - y) * @state.height) || 0

        points.push {x,y}

      points.push x: @state.width, y: @state.height

      path = <path key="p" d={'M ' + points.map((p) -> "#{p.x} #{p.y}").join ' L '}/>


    <div className="ui waveform">
      <div className="control">
        <div ref="container">
          <svg width={@state.width} height={@state.height}>
            {path}
          </svg>
        </div>
      </div>
    </div>
