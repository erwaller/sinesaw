# @cjsx React.DOM

React = require 'react'
Updatable = require './ui/mixins/updatable'
Modelable = require './ui/mixins/modelable'
Song = require './models/song'
Track = require './models/track'
DrumkitSynthesizer = require './models/drumkit_synthesizer'
AnalogSynthesizer = require './models/analog_synthesizer'
BasicSampler = require './models/basic_sampler'
LoopSampler = require './models/loop_sampler'
DrumSampler = require './models/drum_sampler'
PlaybackControl = require './ui/playback_control'
TrackSelection = require './ui/track_selection'
PianoRoll = require './ui/piano_roll'
AnalogSynthesizerControl = require './ui/analog_synthesizer_control'
DrumkitSynthesizerControl = require './ui/drumkit_synthesizer_control'
BasicSamplerControl = require './ui/basic_sampler_control'
DrumSamplerControl = require './ui/drum_sampler_control'
LoopSamplerControl = require './ui/loop_sampler_control'

sequences = require './sequences'

module.exports = React.createClass

  mixins: [Updatable, Modelable('song')]

  getInitialState: ->
    selectedTrack: 0

  render: ->
    track = @props.song.state.tracks[@state.selectedTrack]

    if track
      sequence = track.sequence

      if track.instrument instanceof BasicSampler
        instrument = <BasicSamplerControl instrument={track.instrument}/>
      else if track.instrument instanceof AnalogSynthesizer
        instrument = <AnalogSynthesizerControl instrument={track.instrument}/>
      else if track.instrument instanceof DrumkitSynthesizer
        instrument = <DrumkitSynthesizerControl instrument={track.instrument}/>
      else if track.instrument instanceof DrumSampler
        instrument = <DrumSamplerControl instrument={track.instrument}/>
      else if track.instrument instanceof LoopSampler
        instrument = <LoopSamplerControl instrument={track.instrument}/>

    <div className="app">
      <div className="row playback">
        <PlaybackControl song={@props.song}/>
      </div>
      <div className="row main">
        <div className="column sidebar">
          <TrackSelection
            tracks={@props.song.state.tracks}
            addTrack={@props.song.addTrack}
            removeTrack={@props.song.removeTrack}
            sortTracks={@props.song.createSetterFor 'tracks'}
            selectedTrack={@state.selectedTrack}
            selectTrack={@update('selectedTrack')}
          />
        </div>
        <div className="column main">
          <div className="row sequence">
            <PianoRoll sequence={sequence} song={@props.song}/>
          </div>
          <div className="row instrument">
            {instrument}
          </div>
        </div>
      </div>
    </div>
