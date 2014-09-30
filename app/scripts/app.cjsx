# @cjsx React.DOM

React = require 'react/addons'
Updatable = require './ui/mixins/updatable'
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

  mixins: [Updatable]

  getInitialState: ->
    selectedTrack: 0
    modalContent: null

  launchModal: (modalContent) ->
    @props.song.set 'playing', false
    @setState {modalContent}

  dismissModal: ->
    @setState modalContent: null

  render: ->
    track = @props.song.cursor ['tracks', @state.selectedTrack]

    if track
      sequence = track.cursor 'sequence'
      instrument = track.cursor 'instrument'

      controlClass = switch instrument.get '_type'
        when 'BasicSampler' then BasicSamplerControl
        when 'AnalogSynthesizer' then AnalogSynthesizerControl
        when 'DrumkitSynthesizer' then DrumkitSynthesizerControl
        when 'DrumSampler' then DrumSamplerControl
        when 'LoopSampler' then LoopSamplerControl
        else null

      if controlClass?
        instrumentControl = <controlClass key={track.get '_id'} instrument={instrument} app={this}/>

    if @state.modalContent?
      modal = <Modal key='m'>{@state.modalContent}</Modal>

    <div className="app">
      <div className="row playback">
        <PlaybackControl song={@props.song}/>
      </div>
      <div className="row main">
        <div className="column sidebar">
          <TrackSelection
            tracks={@props.song.cursor 'tracks'}
            selectedTrack={@state.selectedTrack}
            selectTrack={@update 'selectedTrack'}
          />
        </div>
        <div className="column main">
          <div className="row sequence">
            <PianoRoll song={@props.song} sequence={sequence}/>
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
