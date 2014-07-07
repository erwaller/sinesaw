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

  render: ->
    playClassName = 'icon icon-play' + if @state.playing then ' active' else ''
    recordClassName = 'icon icon-record' + if @state.recording then ' active' else ''

    `<div className="ui playback-control">
      <div className="group">
        <div className={playClassName} onClick={this.play}/>
        <div className={recordClassName} onClick={this.props.song.record}/>
        <div className="icon icon-stop" onClick={this.props.song.stop}/>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group">
        <div className="icon icon-air"/>
      </div>
    </div>`
