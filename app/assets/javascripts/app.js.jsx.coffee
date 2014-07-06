###* @jsx React.DOM ###

window.App =
  start:  ->
    @song = new Song
    @track = new Track
    @song.tracks.push @track

    # ode to joy
    @track.sequence.addNote note for note in [
      # {key: 64, start: 0/2, length: 1/4}
      # {key: 64, start: 1/2, length: 1/4}
      # {key: 65, start: 2/2, length: 1/4}
      # {key: 67, start: 3/2, length: 1/4}
      # {key: 67, start: 4/2, length: 1/4}
      # {key: 65, start: 5/2, length: 1/4}
      # {key: 64, start: 6/2, length: 1/4}
      # {key: 62, start: 7/2, length: 1/4}
      # {key: 60, start: 8/2, length: 1/4}
      # {key: 60, start: 9/2, length: 1/4}
      # {key: 62, start: 10/2, length: 1/4}
      # {key: 62, start: 11/2, length: 1/4}
      # {key: 64, start: 12/2, length: 3/4}
      # {key: 62, start: 14/2, length: 1/4}
      # {key: 62, start: 15/2, length: 1/4}
      {key: 62, start: 0.0, length: 1.5}
      {key: 72, start: 0.75, length: 0.25}
      {key: 58, start: 1.5, length: 1.5}
      {key: 72, start: 2.25, length: 0.25}
      {key: 55, start: 3.0, length: 1.0}
      {key: 72, start: 3.5, length: 0.25}
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
