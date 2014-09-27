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

  mixins: [Modelable('instrument')]

  render: ->
    instrument = @props.instrument

    options = for i in [1..6]
      <option key={i} value={i}>{i}</option>

    <div className="ui basic-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={instrument.get 'level'}
          onChange={->}
        />
        <div className="ui">
          <select value={instrument.get 'polyphony'} onChange={->}>{options}</select>
          <label>Poly</label>
        </div>
      </div>
      <div className="column">
        <SampleControl
          label="Sample"
          app={@props.app}
          onChange={@setSample}
          sampleData={instrument.get 'sampleData'}
          sampleName={instrument.get 'sampleName'}
          sampleStart={instrument.get 'start'}
          onChangeStart={->}
          loopActive={instrument.get('loopActive') == 'loop'}
          sampleLoop={instrument.get 'loop'}
          onChangeLoop={->}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={instrument.get('volumeEnv').toJS()}
          onChange={->}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Filter Env"
          env={instrument.get('filterEnv').toJS()}
          onChange={->}
        />
      </div>
      <div className="column controls">
        <Filter
          label="Filter"
          filter={instrument.get('filter').toJS()}
          onChange={->}
        />
        <div className="row sample">
          <div className="ui">
            <select
              value={instrument.get 'rootKey'}
              onChange={->}
            >
              {keyOptions()}
            </select>
            <label>Root</label>
          </div>
          <Knob
            label="Tune"
            value={instrument.get 'tune'}
            onChange={->}
          />
        </div>
        <div className="row sample">
          <Chooser
            options={['loop','off']}
            value={instrument.get 'loopActive'}
            onChange={->}
          />
          <Knob
            label="Loop"
            value={instrument.get 'loop'}
            disabled={instrument.get('loopActive') == 'off'}
            onChange={->}
          />
          <Knob
            label="Start"
            value={instrument.get 'start'}
            onChange={->}
          />
        </div>
      </div>
    </div>
