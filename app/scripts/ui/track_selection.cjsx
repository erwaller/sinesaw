# @cjsx React.DOM

React = require 'react/addons'
Sortable = require './mixins/sortable'
Modelable = require './mixins/modelable'
Updatable = require './mixins/updatable'
Draggable = require './mixins/draggable'
SizeMeasurable = require './mixins/size_measurable'
Knob = require './knob'
Meter = require './meter'
Menu = require './menu'
Track = require '../models/track'
DrumSampler = require '../models/drum_sampler'
BasicSampler = require '../models/basic_sampler'
LoopSampler = require '../models/loop_sampler'
AnalogSynthesizer = require '../models/analog_synthesizer'
DrumkitSynthesizer = require '../models/drumkit_synthesizer'
ReactCSSTransitionGroup = React.addons.CSSTransitionGroup


TrackRow = React.createClass

  mixins: [Modelable('instrument'), Sortable, React.addons.PureRenderMixin]
  
  render: ->
    className = 'track'
    className += ' selected' if @props.selected
    className += ' dragging' if @isDragging()

    <div
      className={className}
      onClick={@props.selectTrack}
      draggable={true}
      onDragStart={@dragStart}
      onDragEnd={@dragEnd}
      onDragOver={@dragOver}
      data-id={@props.index}
    >
      <div className='name'>{@props.track.state.name}</div>
      <Knob
        label="Level"
        value={@state.level}
        onChange={@props.instrument.createSetterFor('level')}
      />
      <Meter track={@props.track}/>
    </div>


module.exports = React.createClass

  mixins: [Updatable, React.addons.PureRenderMixin]

  trackTypes:
    'Drum Sampler': DrumSampler
    'Basic Sampler': BasicSampler
    'Loop Sampler': LoopSampler
    'Analog Synth': AnalogSynthesizer
    'Drum Synth': DrumkitSynthesizer

  getInitialState: ->
    menuOpen: false
    dragging: null

  componentDidMount: ->
    window.addEventListener 'click', @closeMenu

  componentWillUnmount: ->
    window.removeEventListener 'click', @closeMenu

  closeMenu: ->
    @setState menuOpen: false if @state.menuOpen

  toggleMenu: (e) ->
    e.stopPropagation()
    @setState menuOpen: !@state.menuOpen

  addTrack: (name) ->
    @props.addTrack new Track {name}, new @trackTypes[name]
    @props.selectTrack @props.tracks.length
    @setState menuOpen: false

  removeTrack: ->
    @props.removeTrack @props.selectedTrack
    @props.selectTrack Math.max 0, @props.selectedTrack - 1

  sort: (items, dragging) ->
    @props.sortTracks items
    @props.selectTrack dragging if dragging?
    @setState {dragging}

  render: ->
    tracks = for track, i in @props.tracks
      if track
        do (i) =>
          <TrackRow
            key={track.id}
            index={i}
            track={track}
            instrument={track.instrument}
            selected={@props.selectedTrack == i}
            selectTrack={=> @props.selectTrack i}
            sort={@sort}
            items={@props.tracks}
            dragging={@state.dragging}
          />

    <div className='ui track-selection'>
      <div className="tracks">
        <ReactCSSTransitionGroup transitionName="track">
          {tracks}
        </ReactCSSTransitionGroup>
      </div>
      <div className="controls">
        <Menu options={Object.keys @trackTypes} onSelect={(option) => @addTrack option} open={@state.menuOpen}/>
        <div className="icon icon-plus pull-right" onClick={@toggleMenu}></div>
        <div className="icon icon-minus pull-left" onClick={@removeTrack}></div>
      </div>
    </div>
