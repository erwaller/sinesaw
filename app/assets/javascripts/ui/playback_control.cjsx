# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
ScaleHandle = require './scale_handle'
Keyboard = require '../util/keyboard'

module.exports = React.createClass
  
  mixins: [Modelable('song')]

  componentDidMount: ->
    Keyboard.on 32, @play

  componentWillUnmount: ->
    Keyboard.off 32, @play

  play: ->
    if @state.playing
      @props.song.pause()
    else
      @props.song.play()

  onChangeBpm: (e) ->
    bpm = parseInt e.target.value
    @props.song.set {bpm}

  stopPropagation: (e) ->
    e.stopPropagation()

  render: ->
    playClassName = 'icon icon-play' + if @state.playing then ' active' else ''
    
    bpmOptions = (<option value={i}>{i} bpm</option> for i in [200..20])

    <div className="ui playback-control">
      <div className="group playback">
        <div className={playClassName} onClick={@play}/>
        <div className="icon icon-stop" onClick={@props.song.stop}/>
      </div>
      <div className="group tempo">
        <select value={@state.bpm} onChange={@onChangeBpm}>{bpmOptions}</select>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group menu">
        <div className="icon icon-air"/>
      </div>
    </div>
