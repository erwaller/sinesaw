# @cjsx React.DOM

# markers={
#   start:
#     value: @state.cropStart
#     onChange: @update 'cropStart'
#   end:
#     value: @state.cropEnd
#     onChange: @update 'cropEnd'
# }


React = require 'react/addons'
Updatable = require './mixins/updatable'
Modelable = require './mixins/modelable'
Recording = require '../models/recording'
Waveform = require './waveform'
Meter = require './meter'

module.exports = React.createClass

  mixins: [Updatable, React.addons.PureRenderMixin, Modelable('recording')]
  
  getInitialState: ->
    cropStart: 0
    cropEnd: 1

  getDefaultProps: ->
    recording: new Recording

  onClick: ->
    if @state.active
      @props.recording.stop()
    else unless @state.sampleData?
      @props.recording.record()

  confirm: ->
    @props.onConfirm @state.sampleData

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
        selectionStart={0}
        selectionEnd={1}
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
        'Recording..'
      else
        'Click to Record'

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
