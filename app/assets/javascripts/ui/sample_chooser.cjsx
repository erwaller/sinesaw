React = require 'react/addons'
Waveform = require './waveform'

decoder = new webkitAudioContext

module.exports = React.createClass

  mixins: [React.addons.pureRenderMixin]

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

  render: ->
    <div className="ui sample-chooser">
      <input type="file" ref="input" onChange={@onFileSelect}/>
      <div className="trigger" onClick={@triggerFileInput}>
        <Waveform sampleData={@props.sampleData}/>
        <div className="file-name">{@props.sampleName}</div>
        <div className="instruction" style={{display: if @props.sampleData? then 'none' else 'block'}}>
          click to upload
        </div>
      </div>
      <label>{@props.label}</label>
    </div>
