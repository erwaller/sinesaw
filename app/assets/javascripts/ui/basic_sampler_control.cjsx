# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Knob = require './knob'
Slider = require './slider'
SampleChooser = require './sample_chooser'
Envelope = require './envelope'
Filter = require './filter'


keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
rootKeyOptions = for i in [127..0]
  octave = Math.floor(i / 12) - 2
  note = keys[i % 12]
  <option key={i} value={i}>{"#{note}#{octave}"}</option>


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
          <select
            onChange={@props.instrument.createBindingFor('rootKey')}
            value={@props.instrument.state.rootKey}
          >
            {rootKeyOptions}
          </select>
          <label>Root</label>
        </div>
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
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={@props.instrument.state.volumeEnv}
          onChange={@props.instrument.createSetterFor('volumeEnv')}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Filter Env"
          env={@props.instrument.state.filterEnv}
          onChange={@props.instrument.createSetterFor('filterEnv')}
        />
      </div>
      <div className="column controls">
        <Filter
          label="Filter"
          filter={@props.instrument.state.filter}
          onChange={@props.instrument.createSetterFor('filter')}
        />
      </div>
    </div>
