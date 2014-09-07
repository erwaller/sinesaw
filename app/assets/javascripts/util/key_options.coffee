React = require 'react'

keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

module.exports = ->
  for i in [127..0]
    octave = Math.floor(i / 12) - 2
    note = keys[i % 12]
    <option key={i} value={i}>{"#{note}#{octave}"}</option>