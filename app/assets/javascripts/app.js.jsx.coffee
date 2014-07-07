###* @jsx React.DOM ###

window.App =
  start:  ->
    @song = new Song
    @track = new Track
    @song.tracks.push @track

    # ode to joy
    @track.sequence.addNote note for note in [
      {key: 45, start: 0/2, length: 1/2}
      {key: 57, start: 1/2, length: 1/2}
      {key: 45, start: 2/2, length: 1/2}
      {key: 57, start: 3/2, length: 1/2}
      {key: 45, start: 4/2, length: 1/2}
      {key: 57, start: 5/2, length: 1/2}
      {key: 45, start: 6/2, length: 1/2}
      {key: 57, start: 7/2, length: 1/2}
      {key: 47, start: 8/2, length: 1/2}
      {key: 59, start: 9/2, length: 1/2}
      {key: 64, start: 10/2, length: 1/2}
      {key: 59, start: 11/2, length: 1/2}
      {key: 48, start: 12/2, length: 1/2}
      {key: 60, start: 13/2, length: 1/2}
      {key: 67, start: 14/2, length: 1/2}
      {key: 60, start: 15/2, length: 1/2}
    ]

    React.renderComponent(
      `<div className="app">
        <div className="row playback">
          <PlaybackControl song={this.song}/>
        </div>
        <div className="row piano-roll">
          <PianoRoll sequence={this.track.sequence} song={this.song}/>
        </div>
        <div className="row instrument">
          <Analog instrument={this.track.instrument}/>
        </div>
      </div>`
    , document.body)
