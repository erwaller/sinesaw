# @cjsx React.DOM

React = require 'react/addons'
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
Modal = require './ui/modal'
ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

module.exports = React.createClass

  mixins: [Updatable, Modelable('song')]

  getInitialState: ->
    selectedTrack: 0
    modalContent: null

  launchModal: (modalContent) ->
    @props.song.stop()
    @setState {modalContent}

  dismissModal: ->
    @setState modalContent: null  

  render: ->
    track = @props.song.state.tracks[@state.selectedTrack]

    if track
      sequence = track.sequence
      
      controlClass = if track.instrument instanceof BasicSampler
        BasicSamplerControl
      else if track.instrument instanceof AnalogSynthesizer
        AnalogSynthesizerControl
      else if track.instrument instanceof DrumkitSynthesizer
        DrumkitSynthesizerControl
      else if track.instrument instanceof DrumSampler
        DrumSamplerControl
      else if track.instrument instanceof LoopSampler
        LoopSamplerControl

      instrumentControl = <controlClass key={track.id} instrument={track.instrument} app={this}/>

    if @state.modalContent?
      modal = <Modal key='m'>{@state.modalContent}</Modal>

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
            {instrumentControl}
          </div>
        </div>
      </div>
      <ReactCSSTransitionGroup transitionName="modal">
        {modal}
      </ReactCSSTransitionGroup>
    </div>
