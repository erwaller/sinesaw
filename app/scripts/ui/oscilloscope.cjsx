React = require 'react'

module.exports = React.createClass

  renderCanvas: ->
    canvas = @getDOMNode()
    buffer = @props.buffer

    canvasWidth = canvas.width
    canvasHeight = canvas.height
    canvasHalfHeight = canvasHeight * 0.5
    bufferLength = buffer.length
    stepSize = Math.floor bufferLength / canvasWidth * 2
    x = 0

    ctx = canvas.getContext '2d'
    ctx.clearRect 0, 0, canvasWidth, canvasHeight
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgb(255, 255, 255)'
    ctx.beginPath()

    for i in [0...bufferLength] by stepSize
      v = 1 - buffer[i]
      y = v * canvasHalfHeight
      if i is 0
        ctx.moveTo x, y
      else
        ctx.lineTo x, y
      x += 2

    ctx.lineTo canvasWidth, canvasHalfHeight
    ctx.stroke()

  render: ->
    setTimeout @renderCanvas
    <canvas className='ui oscilloscope' width='160' height='40'/>
