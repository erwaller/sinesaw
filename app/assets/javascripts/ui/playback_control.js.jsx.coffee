###* @jsx React.DOM ###

@PlaybackControl = React.createClass
  
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

  onChangeBpm: (value) ->
    bpm = Math.floor Math.pow 10, value - 0.00000001
    @props.song.set {bpm}

  stopPropagation: (e) ->
    e.stopPropagation()

  render: ->
    playClassName = 'icon icon-play' + if @state.playing then ' active' else ''
    recordClassName = 'icon icon-record' + if @state.recording then ' active' else ''

    `<div className="ui playback-control">
      <div className="group playback">
        <div className={playClassName} onClick={this.play}/>
        <div className={recordClassName} onClick={this.props.song.record}/>
        <div className="icon icon-stop" onClick={this.props.song.stop}/>
      </div>
      <div className="group tempo">
        <ScaleHandle value={Math.log(this.state.bpm) / Math.LN10} min={0} max={3} onChange={this.onChangeBpm}>
          {this.state.bpm} bpm
        </ScaleHandle>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group menu">
        <div className="icon icon-air"/>
      </div>
    </div>`
