# @cjsx React.DOM

React = require 'react'
Updatable = require './mixins/updatable'
Knob = require './knob'
Slider = require './slider'
ListControl = require './list_control'
keyOptions = require '../util/key_options'


Drum = React.createClass

  update: (key) ->
    (value) =>
      o = {}
      for k, v of @props.drum
        o[k] = if k == key then value else v
      @props.onChange o

  bind: (key) ->
    update = @update key
    (e) -> update e.target.value

  render: ->
    <div className='drum'>
      <div className='column attrs'>
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
      <div className="column control">
        <div className="ui">
          <select
            value={@props.drum.key}
            onChange={@bind 'key'}
          >
            {keyOptions()}
          </select>
          <label>Trigger</label>
        </div>
      </div>
    </div>


module.exports = React.createClass

  mixins: [Updatable]

  getInitialState: ->
    activeDrum: 0

  onAddDrum: ->
    @props.instrument.addDrum()
    @setState activeDrum: @props.instrument.state.drums.length - 1

  onRemoveDrum: ->
    @props.instrument.removeDrum @state.activeDrum
    @setState activeDrum: Math.min @state.activeDrum, @props.instrument.state.drums.length - 1

  render: ->
    activeDrum = @props.instrument.state.drums[@state.activeDrum]
    updateDrum = @props.instrument.createSetterForDrum @state.activeDrum

    <div className="ui drumkit">
      <div className="column channel">
        <Slider
          label="Level"
          value={@props.instrument.state.level}
          onChange={@props.instrument.createSetterFor('level')}
        />
      </div>
      <ListControl
        options={@props.instrument.state.drums}
        selectedIndex={@state.activeDrum}
        onSelect={@update 'activeDrum'}
        onAdd={@onAddDrum}
        onRemove={@onRemoveDrum}
        onSort={@props.instrument.createSetterFor 'drums'}
      />
      <Drum drum={activeDrum} onChange={updateDrum}/>
    </div>
