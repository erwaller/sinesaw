###* @jsx React.DOM ###

Track = React.createClass

  mixins: [Modelable('instrument')]
  
  render: ->
    track = @props.track
    className = 'track'
    className += ' selected' if @props.selected

    `<div className={className} onClick={this.props.selectTrack}>
      <div className='name'>{this.props.track.state.name}</div>
      <Knob
        label="Level"
        value={this.state.level}
        onChange={this.props.instrument.createSetterFor('level')}
      />
      <Meter track={this.props.track}/>
    </div>`

@TrackSelection = React.createClass

  render: ->
    selectTrack = @props.selectTrack
    tracks = for track, i in @props.tracks
      do (i) =>
        `<Track
          key={i}
          track={track}
          instrument={track.instrument}
          selected={_this.props.selectedTrack == i}
          selectTrack={function(){selectTrack(i)}}
        />`

    `<div className='ui track-selection'>
      {tracks}
   </div>`