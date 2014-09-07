React = require 'react'

module.exports = ->
  for i in [24..-24]
    <option key={i} value={i}>{i}</option>
