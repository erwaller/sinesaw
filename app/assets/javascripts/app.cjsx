# @cjsx React.DOM

React = require 'react'
Updatable = require './ui/mixins/updatable'
Song = require './models/song'
Track = require './models/track'
DrumkitSynthesizer = require './models/drumkit_synthesizer'
AnalogSynthesizer = require './models/analog_synthesizer'
PlaybackControl = require './ui/playback_control'
TrackSelection = require './ui/track_selection'
PianoRoll = require './ui/piano_roll'
Analog = require './ui/analog'
Drumkit = require './ui/drumkit'
sequences = require './sequences'

module.exports = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    song = new Song

    song.tracks = [
      new Track new DrumkitSynthesizer, name: 'Drum Kit'
      new Track new AnalogSynthesizer, name: 'Analog 1'
      new Track new AnalogSynthesizer, name: 'Analog 2'
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
      instrument = <Analog instrument={track.instrument}/>
    else if track.instrument instanceof DrumkitSynthesizer
      instrument = <Drumkit instrument={track.instrument}/>

    <div className="app">
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
    </div>
