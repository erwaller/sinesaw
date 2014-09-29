# @cjsx React.DOM

React = require 'react/addons'
Modelable = require './mixins/modelable'
Recording = require '../models/recording'
Waveform = require './waveform'
Meter = require './meter'

module.exports = React.createClass

  mixins: [Modelable]

  onClick: ->
    if @state.active
      @props.recording.stop()
    else unless @state.sampleData?
      @props.recording.record()

  confirm: ->
    @props.onConfirm @props.recording.croppedSampleData()

  render: ->

    leftButtons = [
      <div
        className={"icon icon-record #{if @state.active then ' active' else ''}"}
        key="r"
        onClick={if @state.active then @props.recording.stop else @props.recording.record}
      />
    ]

    rightButtons = [
      <div className="icon icon-cross" key="c" onClick={@props.onCancel}/>
    ]

    if @state.sampleData?
      
      waveform = <Waveform
        sampleData={@state.sampleData}
        selectionStart={@state.cropStart}
        selectionEnd={@state.cropEnd}
        markers={
          start:
            value: @state.cropStart
            onChange: @props.recording.createSetterFor 'cropStart'
          end:
            value: @state.cropEnd
            onChange: @props.recording.createSetterFor 'cropEnd'
        }
      />

      leftButtons.push <div
        className="icon icon-play #{if @state.playing then ' active' else ''}"
        key="p"
        onClick={if @state.playing then @props.recording.stop else @props.recording.play}
      />

      rightButtons.push <div className="icon icon-checkmark" key="s" onClick={@confirm}/>

    else

      message = if @state.error?
        @props.recording.state.error
      else if @state.active
        'Recording, click to stop'
      else
        'Click to record'

      instruction = <div className="instruction">{message}</div>


    <div className="ui record-control">
      <div className="row sample">
        <div className="display" onClick={@onClick}>
          {waveform}
          {instruction}
        </div>
      </div>
      <div className="row controls">
        <div className="left">
          {leftButtons}
        </div>
        <div className="right">
          {rightButtons}
        </div>
      </div>
    </div>
