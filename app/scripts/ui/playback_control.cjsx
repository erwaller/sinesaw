# this renders the top bar of the application with playback and temp controls.
# PlaybackController accepts one property - a song cursor

React = require 'react'
ScaleHandle = require './scale_handle'

module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin]

  propTypes:
    data: React.PropTypes.object.isRequired
    song: React.PropTypes.object.isRequired

  render: ->
    playing = @props.data.get 'playing'

    <div className="ui playback-control">
      <div className="group playback">
        <div
          className={"icon icon-play#{if playing then ' active' else ''}"}
          onClick={
            if playing
            then @props.song.pause
            else @props.song.play
          }
        />
        <div className="icon icon-record" onClick={@props.song.record}/>
        <div className="icon icon-stop" onClick={@props.song.stop}/>
      </div>
      <div className="group tempo">
        <select
          value={@props.data.get 'bpm'}
          onChange={@props.data.bind 'bpm', (e) -> parseInt e.target.value}
        >
          {
            for i in [200..20]
              <option key={i} value={i}>{i} bpm</option>
          }
        </select>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group menu">
        <div className="icon icon-air"/>
      </div>
    </div>
