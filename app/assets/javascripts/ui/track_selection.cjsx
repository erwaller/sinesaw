# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Knob = require './knob'
Meter = require './meter'

Track = React.createClass

  mixins: [Modelable('instrument')]
  
  render: ->
    track = @props.track
    className = 'track'
    className += ' selected' if @props.selected

    <div className={className} onClick={@props.selectTrack}>
      <div className='name'>{@props.track.state.name}</div>
      <Knob
        label="Level"
        value={@state.level}
        onChange={@props.instrument.createSetterFor('level')}
      />
      <Meter track={@props.track}/>
    </div>


module.exports = React.createClass

  render: ->
    tracks = for track, i in @props.tracks
      do (i) =>
        <Track
          key={i}
          track={track}
          instrument={track.instrument}
          selected={@props.selectedTrack == i}
          selectTrack={=> @props.selectTrack i}
        />

    <div className='ui track-selection'>
      {tracks}
    </div>