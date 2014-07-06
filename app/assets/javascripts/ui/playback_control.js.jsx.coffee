###* @jsx React.DOM ###

@PlaybackControl = React.createClass
  
  mixins: [Modelable('song')]

  render: ->
    playClassName = 'icon icon-play' + if @state.playing then ' active' else ''
    recordClassName = 'icon icon-record' + if @state.recording then ' active' else ''

    `<div className="ui playback-control">
      <div className="group">
        <div className={playClassName} onClick={this.state.playing ? this.props.song.pause : this.props.song.play}/>
        <div className={recordClassName} onClick={this.props.song.record}/>
        <div className="icon icon-stop" onClick={this.props.song.stop}/>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group">
        <div className="icon icon-air"/>
      </div>
    </div>`
