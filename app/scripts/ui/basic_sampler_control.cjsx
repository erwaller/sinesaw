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

  mixins: [Modelable]

  setStart: (value) ->
    @props.instrument.update (instrument) =>
      instrument.merge
        start: value
        loop: Math.max value, instrument.get 'loop'

  setLoop: (value) ->
    @props.instrument.update (instrument) =>
      instrument.merge
        loop: value
        start: Math.min value, instrument.get 'start'

  render: ->
    instrument = @props.instrument

    options = for i in [1..6]
      <option key={i} value={i}>{i}</option>

    <div className="ui basic-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={instrument.get 'level'}
          onChange={@updateCursor instrument, 'level'}
        />
        <div className="ui">
          <select
            value={instrument.get 'polyphony'}
            onChange={@updateCursor instrument, 'polyphony', (e) -> parseInt e.target.value}
          >
            {options}
          </select>
          <label>Poly</label>
        </div>
      </div>
      <div className="column">
        <SampleControl
          label="Sample"
          app={@props.app}
          sampler={instrument}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={instrument.cursor 'volumeEnv'}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Filter Env"
          env={instrument.cursor 'filterEnv'}
        />
      </div>
      <div className="column controls">
        <Filter
          label="Filter"
          filter={instrument.cursor 'filter'}
        />
        <div className="row sample">
          <div className="ui">
            <select
              value={instrument.get 'rootKey'}
              onChange={@updateCursor instrument, 'rootKey', (e) -> parseInt e.target.value}
            >
              {keyOptions()}
            </select>
            <label>Root</label>
          </div>
          <Knob
            label="Tune"
            value={instrument.get 'tune'}
            onChange={@updateCursor instrument, 'tune'}
          />
        </div>
        <div className="row sample">
          <Chooser
            options={['loop','off']}
            value={instrument.get 'loopActive'}
            onChange={@updateCursor instrument, 'loopActive'}
          />
          <Knob
            label="Loop"
            value={instrument.get 'loop'}
            disabled={instrument.get('loopActive') == 'off'}
            onChange={@setLoop}
          />
          <Knob
            label="Start"
            value={instrument.get 'start'}
            onChange={@setStart}
          />
        </div>
      </div>
    </div>
