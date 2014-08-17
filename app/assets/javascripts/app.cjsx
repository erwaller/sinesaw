# @cjsx React.DOM

React = require 'react'
Updatable = require './ui/mixins/updatable'
Song = require './models/song'
Track = require './models/track'
DrumkitSynthesizer = require './models/drumkit_synthesizer'
AnalogSynthesizer = require './models/analog_synthesizer'
BasicSampler = require './models/basic_sampler'
PlaybackControl = require './ui/playback_control'
TrackSelection = require './ui/track_selection'
PianoRoll = require './ui/piano_roll'
AnalogSynthesizerControl = require './ui/analog_synthesizer_control'
DrumkitSynthesizerControl = require './ui/drumkit_synthesizer_control'
BasicSamplerControl = require './ui/basic_sampler_control'

sequences = require './sequences'

module.exports = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    song = new Song

    song.tracks = [
      new Track name: 'Drum Synth', new DrumkitSynthesizer
      new Track name: 'Basic Sampler', new BasicSampler
      new Track name: 'Analog Synth', new AnalogSynthesizer
    ]

    # song.tracks[0].sequence.addNote note for note in sequences.fourfour
    # song.tracks[1].sequence.addNote note for note in sequences.beat
    # song.tracks[1].sequence.state.loopSize = 4
    # song.tracks[1].instrument.state.level = 0
    # song.tracks[2].sequence.addNote note for note in sequences.terje
    # song.tracks[2].sequence.state.loopSize = 8
    # song.tracks[2].instrument.state.level = 0

    selectedTrack = 0

    # song.play()

    {song, selectedTrack}

  render: ->
    song = @state.song
    track = @state.song.tracks[@state.selectedTrack]

    if track.instrument instanceof BasicSampler
      instrument = <BasicSamplerControl instrument={track.instrument}/>
    else if track.instrument instanceof AnalogSynthesizer
      instrument = <AnalogSynthesizerControl instrument={track.instrument}/>
    else if track.instrument instanceof DrumkitSynthesizer
      instrument = <DrumkitSynthesizerControl instrument={track.instrument}/>

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
