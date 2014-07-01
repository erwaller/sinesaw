###* @jsx React.DOM ###

@PlaybackControl = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    playing: false
    recording: false

  render: ->
    playClassName = 'icon icon-play' + if @state.playing then ' active' else ''
    recordClassName = 'icon icon-record' + if @state.recording then ' active' else ''

    `<div className="ui playback-control">
      <div className="group">
        <div className={playClassName} onClick={this.updateTo({playing: !this.state.playing})}/>
        <div className={recordClassName} onClick={this.updateTo({recording: !this.state.recording})}/>
        <div className="icon icon-stop" onClick={this.updateTo({playing: false, recording: false})}/>
      </div>
      <div className="logo">sinesaw</div>
      <div className="group">
        <div className="icon icon-air"/>
      </div>
    </div>`