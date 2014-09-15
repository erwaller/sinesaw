React = require 'react/addons'
Waveform = require './waveform'
RecordControl = require './record_control'

decoder = new webkitAudioContext

module.exports = React.createClass

  # range in pixels for vertical drag to zoom
  range: 300
  dragTypeDistance: 10

  mixins: [React.addons.pureRenderMixin]

  getDefaultProps: ->
    sampleStart: 0

  triggerFileInput: ->
    @refs.input.getDOMNode().click()

  onFileSelect: ->
    file = @refs.input.getDOMNode().files[0]

    if file?
      reader = new FileReader
      reader.onload = (e) =>
        decoder.decodeAudioData e.target.result, (buffer) =>
          data = buffer.getChannelData 0
          @props.onChange file.name, data
      reader.readAsArrayBuffer file

  clear: ->
    @props.onChange null, null

  recordSample: ->
    @props.app.launchModal <RecordControl
      onCancel={@props.app.dismissModal}
      onConfirm={
        (sampleData) =>
          @props.onChange 'recorded.wav', sampleData
          @props.app.dismissModal()
      }
    />

  render: ->
    markers = {}

    if @props.sampleStart?
      markers.start =
        value: @props.sampleStart
        onChange: @props.onChangeStart

    if @props.loopActive
      markers.loop =
        value: @props.sampleLoop
        onChange: @props.onChangeLoop

    <div className="ui sample-control">
      <input type="file" ref="input" onChange={@onFileSelect}/>
      <div
        className="display"
        ref="container"
        onClick={if @props.sampleData? then null else @triggerFileInput}
      >
        {if @props.sampleData? then null else <div className="instruction">click to upload</div>}
        <Waveform
          sampleData={@props.sampleData}
          selectionStart={@props.sampleStart}
          selectionEnd={if @props.loopActive then @props.sampleLoop else 1}
          markers={markers}
        />
      </div>
      <div className="controls">
        <div className="control" onClick={@triggerFileInput}>
          <div className="icon icon-arrow-up"/>
        </div>
        <div className="control" onClick={@recordSample}>
          <div className="icon icon-record"/>
        </div>
        <div className="control" onClick={@clear}>
          <div className="icon icon-cross"/>
        </div>
        <div className="file-name">{@props.sampleName}</div>
      </div>
      <label>{@props.label}</label>
    </div>