# @cjsx React.DOM

React = require 'react/addons'
Modelable = require './mixins/modelable'
Knob = require './knob'
Chooser = require './chooser'
Slider = require './slider'
SampleControl = require './sample_control'
Envelope = require './envelope'
Filter = require './filter'
keyOptions = require '../util/key_options'


module.exports = React.createClass

  getInitialState: ->
    buffer: null

  mixins: [Modelable('instrument'), React.addons.PureRenderMixin]

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
        <SampleControl
          label="Sample"
          onChange={@setSample}
          sampleData={@props.instrument.state.sampleData}
          sampleName={@props.instrument.state.sampleName}
          sampleStart={@props.instrument.state.start}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={@props.instrument.state.volumeEnv}
          onChange={@props.instrument.createSetterFor 'volumeEnv'}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Filter Env"
          env={@props.instrument.state.filterEnv}
          onChange={@props.instrument.createSetterFor 'filterEnv'}
        />
      </div>
      <div className="column controls">
        <Filter
          label="Filter"
          filter={@props.instrument.state.filter}
          onChange={@props.instrument.createSetterFor 'filter'}
        />
        <div className="row sample">
          <div className="ui">
            <select
              onChange={@props.instrument.createBindingFor('rootKey')}
              value={@props.instrument.state.rootKey}
            >
              {keyOptions()}
            </select>
            <label>Root</label>
          </div>
          <Knob
            label="Tune"
            value={@props.instrument.state.tune}
            onChange={@props.instrument.createSetterFor 'tune'}
          />
        </div>
        <div className="row sample">
          <Chooser
            options={['loop','off']}
            value={@props.instrument.state.loopActive}
            onChange={@props.instrument.createSetterFor 'loopActive'}
          />
          <Knob
            label="Loop"
            value={@props.instrument.state.loop}
            disabled={@props.instrument.state.loopActive == 'off'}
            onChange={@props.instrument.createSetterFor 'loop'}
          />
          <Knob
            label="Start"
            value={@props.instrument.state.start}
            onChange={@props.instrument.createSetterFor 'start'}
          />
        </div>
      </div>
    </div>
