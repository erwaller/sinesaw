# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Updatable = require './mixins/updatable'
Sortable = require './mixins/sortable'
Knob = require './knob'
Slider = require './slider'
ListControl = require './list_control'
SampleControl = require './sample_control'
Envelope = require './envelope'
keyOptions = require '../util/key_options'
transposeOptions = require '../util/transpose_options'


Drum = React.createClass

  mixins: [Sortable, React.addons.Pure]

  update: (key) ->
    (value) =>
      o = {}
      for k, v of @props.drum
        o[k] = if k == key then value else v
      @props.onChange o

  bind: (key) ->
    update = @update key
    (e) -> update e.target.value

  setSample: (sampleName, sampleData) ->
    o = {}
    o[k] = v for k, v of @props.drum

    o.sampleName = sampleName
    o.sampleData = sampleData

    @props.onChange o

  render: ->
    return <div className="drum"/> unless @props.drum

    <div className="drum">
      <div className="column">
        <SampleControl
          label={"Sample"}
          onChange={@setSample}
          sampleData={@props.drum.sampleData}
          sampleName={@props.drum.sampleName}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={@props.drum.volumeEnv}
          onChange={@update 'volumeEnv'}
        />
      </div>
      <div className="column control">
        <Knob
          label="Level"
          value={@props.drum.level}
          onChange={@update 'level'}
        />
        <div className="ui">
          <select
            value={@props.drum.transpose}
            onChange={@bind 'transpose'}
          >
            {transposeOptions()}
          </select>
          <label>Transpose</label>
        </div>
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

  mixins: [Modelable('instrument'), Updatable]

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

    <div className="ui drum-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={@state.level}
          onChange={@props.instrument.createSetterFor 'level'}
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