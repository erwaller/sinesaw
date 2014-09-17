React = require 'react/addons'

module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin]

  render: ->
    sampleData = @props.sampleData
    resolution = @props.resolution
    sliceSize = @props.sliceSize
    windowStart = @props.windowStart
    fromSlice = @props.fromSlice
    toSlice = @props.toSlice
    width = @props.width
    height = @props.height - @props.marginTop - @props.marginBottom
    top = @props.marginBottom
    bottom = @props.height - @props.marginBottom

    points = []

    points.push "#{fromSlice * width / resolution} #{bottom}"

    for i in [fromSlice..toSlice]
      sliceStart = i * sliceSize + windowStart
      sliceEnd = sliceStart + sliceSize

      x = i * width / resolution

      y = 0
      for j in [Math.floor(sliceStart)...Math.floor(sliceEnd)]
        v = Math.abs sampleData[j]
        y = v if v > y
      y = (((1 - y) * height) || 0) + top

      points.push "#{x} #{y}"

    points.push "#{x} #{bottom}"

    d = "M #{points.join ' L '}"

    className = 'selection' if @props.selection

    <path className={className} d={d}/>