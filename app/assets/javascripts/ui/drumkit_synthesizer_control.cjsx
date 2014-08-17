# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Updatable = require './mixins/updatable'
Knob = require './knob'
Slider = require './slider'
ListControl = require './list_control'

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
    </div>


module.exports = React.createClass

  mixins: [Modelable('instrument')]

  getInitialState: ->
    activeDrum: 0

  render: ->
    activeDrum = @props.instrument.state.drums[@state.activeDrum]
    updateDrum = @props.instrument.createSetterForDrum @state.activeDrum
    drumOptions = @props.instrument.state.drums.map (drum) -> drum.name

    <div className="ui drumkit">
      <div className="column channel">
        <Slider
          label="Level"
          value={@props.instrument.state.level}
          onChange={@props.instrument.createSetterFor('level')}
        />
        <Knob
          label="Pan"
          value={@props.instrument.state.pan}
          onChange={@props.instrument.createSetterFor('pan')}
        />
      </div>
      <ListControl
        options={drumOptions}
        selectedIndex={@state.activeDrum}
        onSelect={(v) => @setState activeDrum: v}
        onAdd={@props.instrument.addDrum}
        onDelete={@props.instrument.removeDrum}
      />
      <Drum drum={activeDrum} onChange={updateDrum}/>
    </div>