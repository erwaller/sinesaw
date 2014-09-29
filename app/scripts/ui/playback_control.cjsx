# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
ScaleHandle = require './scale_handle'
Keyboard = require 'keyboardjs'

module.exports = React.createClass

  mixins: [Modelable]

  componentDidMount: ->
    @keyBindings = [
      Keyboard.on 'space', @onSpaceKey
    ]

  componentWillUnmount: ->
    binding.clear() for binding in @keyBindings

  onSpaceKey: (e) ->
    e.preventDefault()

    if @props.song.get 'playing'
      @props.song.update (song) -> song.set 'playing', false
    else
      @props.song.update (song) -> song.set 'playing', true

  render: ->
    song = @props.song

    playClassName = 'icon icon-play' + if song.get('playing') then ' active' else ''
    
    bpmOptions = (<option key={i} value={i}>{i} bpm</option> for i in [200..20])

    <div className="ui playback-control">
      <div className="group playback">
        <div className={playClassName} onClick={@updateCursor song, 'playing', -> not song.get 'playing'}/>
        <div className="icon icon-record"/>
        <div className="icon icon-stop" onClick={@updateCursor song, 'playing', -> false}/>
      </div>
      <div className="group tempo">
        <select value={song.get 'bpm'} onChange={@updateCursor song, 'bpm', (e) -> parseInt e.target.value}>{bpmOptions}</select>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group menu">
        <div className="icon icon-air"/>
      </div>
    </div>
