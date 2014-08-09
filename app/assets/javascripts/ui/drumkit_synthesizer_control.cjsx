# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Knob = require './knob'
Slider = require './slider'

Drum = React.createClass

  update: (key) ->
    (value) =>
      o = {}
      for k, v of @props.drum
        o[k] = if k == key then value else v
      @props.onChange o

  # level decay noise
  # pitch bend hp 
  # fm fmdcy pan

  render: ->
    <div className='drum'>
      <div className='column'>
        <Knob
          label="Level"
          value={@props.drum.level}
          onChange={@update('level')}
        />
        <Knob
          label="Pitch"
          value={@props.drum.pitch}
          onChange={@update('pitch')}
        />
        <Knob
          label="FM"
          value={@props.drum.fm}
          onChange={@update('fm')}
        />
        <Knob
          label="Dcy"
          value={@props.drum.decay}
          onChange={@update('decay')}
        />
        <Knob
          label="Bend"
          value={@props.drum.bend}
          onChange={@update('bend')}
        />
        <Knob
          label="MDcy"
          value={@props.drum.fmDecay}
          onChange={@update('fmDecay')}
        />
        <Knob
          label="Noise"
          value={@props.drum.noise}
          onChange={@update('noise')}
        />
        <Knob
          label="HP"
          value={@props.drum.hp}
          onChange={@update('hp')}
        />
        <Knob
          label="MFrq"
          value={@props.drum.fmFreq}
          onChange={@update('fmFreq')}
        />
      </div>
      <label>{@props.drum.name}</label>
    </div>


module.exports = React.createClass

  mixins: [Modelable('instrument')]

  render: ->
    drums = for i in [0...5]
      key = "drum#{i}"
      drum = @props.instrument.state[key]
      <Drum key={i} drum={drum} onChange={@props.instrument.createSetterFor(key)}/>

    <div className="ui drumkit">
      <div className="column channel">
        <Slider
          label="Level"
          value={@state.level}
          onChange={@props.instrument.createSetterFor('level')}
        />
        <Knob
          label="Pan"
          value={@state.pan}
          onChange={@props.instrument.createSetterFor('pan')}
        />
      </div>
      {drums}
    </div>