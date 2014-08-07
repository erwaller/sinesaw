# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Slider = require './slider'
Envelope = require './envelope'
Filter = require './filter'
Oscillator = require './oscillator'


module.exports = React.createClass

  mixins: [Modelable('instrument')]

  setPolyphony: (e) ->
    @props.instrument.setPolyphony parseInt e.target.value

  render: ->
    options = for i in [1..@props.instrument.maxPolyphony]
      <option key={i} value={i}>{i}</option>

    <div className="ui analog">
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
      <div className="column oscillators">
        <Filter
          label="Filter"
          filter={@props.instrument.state.filter}
          onChange={@props.instrument.createSetterFor('filter')}
        />
        <Oscillator
          label="Osc 1"
          osc={@props.instrument.state.osc1}
          onChange={@props.instrument.createSetterFor('osc1')}
        />
        <Oscillator
          label="Osc 2"
          osc={@props.instrument.state.osc2}
          onChange={@props.instrument.createSetterFor('osc2')}
        />
      </div>
    </div>
