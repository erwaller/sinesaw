# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Knob = require './knob'
Slider = require './slider'
SampleChooser = require './sample_chooser'
Envelope = require './envelope'

module.exports = React.createClass

  getInitialState: ->
    buffer: null

  mixins: [Modelable('instrument')]

  setSample: (sampleName, sampleData) ->
    @props.instrument.set {sampleName, sampleData}

  setPolyphony: (e) ->
    @props.instrument.setPolyphony parseInt e.target.value

  render: ->
    options = for i in [1..@props.instrument.maxPolyphony]
      <option key={i} value={i}>{i}</option>

    <div className="ui basic-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={@state.level}
          onChange={@props.instrument.createSetterFor('level')}
        />
        <div className="ui">
          <select onChange={@setPolyphony} value={@state.polyphony}>{options}</select>
          <label>Poly</label>
        </div>
      </div>
      <div className="column">
        <SampleChooser
          label="Sample"
          onChange={@setSample}
          sampleData={@props.instrument.state.sampleData}
          sampleName={@props.instrument.state.sampleName}
        />
      </div>
      <div className="column">
        <Envelope
          label="Volume Env"
          env={@props.instrument.state.volumeEnv}
          onChange={@props.instrument.createSetterFor('volumeEnv')}
        />
      </div>
      <div className="column">
        <Envelope
          label="Filter Env"
          env={@props.instrument.state.filterEnv}
          onChange={@props.instrument.createSetterFor('filterEnv')}
        />
      </div>
    </div>
