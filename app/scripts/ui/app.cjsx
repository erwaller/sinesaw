# this is the top level react component - it handles window layout, track
# selection, and modal state.  It expects only one prop, 'data', a root cursor
# to a song object.

React = require 'react/addons'
PlaybackControl = require './playback_control'
TrackSelection = require './track_selection'
PianoRoll = require './piano_roll'
BasicSamplerControl = require './basic_sampler_control'
AnalogSynthesizerControl = require './analog_synthesizer_control'
DrumkitSynthesizerControl = require './drumkit_synthesizer_control'
DrumSamplerControl = require './drum_sampler_control'
LoopSamplerControl = require './loop_sampler_control'
Modal = require './modal'
ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

module.exports = React.createClass

  propTypes:
    data: React.PropTypes.object.isRequired

  getInitialState: ->
    selectedTrack: 0
    modalContent: null

  launchModal: (modalContent) ->
    @props.data.set 'playing', false
    @setState {modalContent}

  dismissModal: ->
    @setState modalContent: null

  render: ->
    track = @props.data.cursor ['tracks', @state.selectedTrack]

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
        instrumentControl =
          <controlClass
            key={track.get '_id'}
            instrument={instrument}
            app={this}
          />

    if @state.modalContent?
      modal = <Modal key='m'>{@state.modalContent}</Modal>

    <div className="app">
      <div className="row playback">
        <PlaybackControl song={@props.data}/>
      </div>
      <div className="row main">
        <div className="column sidebar">
          <TrackSelection
            tracks={@props.data.cursor 'tracks'}
            selectedTrack={@state.selectedTrack}
            selectTrack={(selectedTrack) => @setState {selectedTrack}}
          />
        </div>
        <div className="column main">
          <div className="row sequence">
            <PianoRoll song={@props.data} sequence={sequence}/>
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
