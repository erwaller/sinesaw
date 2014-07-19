###* @jsx React.DOM ###

@App = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    song = new Song

    song.tracks = [
      new Track {name: 'Drum Kit'}, new DrumkitSynthesizer
      new Track {name: 'Analog'}, new AnalogSynthesizer
      new Track {name: 'Analog'}, new AnalogSynthesizer
    ]

    song.tracks[0].sequence.addNote note for note in sequences.beat
    song.tracks[0].sequence.state.loopSize = 4
    song.tracks[1].sequence.addNote note for note in sequences.chords
    song.tracks[1].sequence.state.loopSize = 1

    selectedTrack = 0

    # song.play()

    {song, selectedTrack}

  render: ->
    song = @state.song
    track = @state.song.tracks[@state.selectedTrack]

    if track.instrument instanceof AnalogSynthesizer
      instrument = `<Analog instrument={track.instrument}/>`
    else if track.instrument instanceof DrumkitSynthesizer
      instrument = `<Drumkit instrument={track.instrument}/>`

    `<div className="app">
      <div className="row playback">
        <PlaybackControl song={song}/>
      </div>
      <div className="row main">
        <div className="column sidebar">
          <TrackSelection
            tracks={song.tracks}
            selectedTrack={this.state.selectedTrack}
            selectTrack={this.update('selectedTrack')}
          />
        </div>
        <div className="column main">
          <div className="row sequence">
            <PianoRoll sequence={track.sequence} song={song}/>
          </div>
          <div className="row instrument">
            {instrument}
          </div>
        </div>
      </div>
    </div>`
