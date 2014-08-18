# @cjsx React.DOM

React = require 'react'
Modelable = require './mixins/modelable'
Updatable = require './mixins/updatable'
Knob = require './knob'
Slider = require './slider'
ListControl = require './list_control'
SampleChooser = require './sample_chooser'
Envelope = require './envelope'


Drum = React.createClass

  update: (key) ->
    (value) =>
      o = {}
      for k, v of @props.drum
        o[k] = if k == key then value else v
      @props.onChange o

  setSample: ->

  render: ->
    return <div className="drum"/> unless @props.drum

    <div className="drum">
      <div className="column">
        <SampleChooser
          label="Sample"
          onChange={@setSample}
          sampleData={@props.drum.sampleData}
          sampleName={@props.drum.sampleName}
        />
      </div>
      <div className="column">
        <Envelope
          label="Volume Env"
          env={@props.drum.volumeEnv}
          onChange={@update 'volumeEnv'}
        />
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
    drumOptions = @props.instrument.state.drums.map (drum) -> drum.name

    <div className="ui drum-sampler">
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
      <ListControl
        options={drumOptions}
        selectedIndex={@state.activeDrum}
        onSelect={@update 'activeDrum'}
        onAdd={@onAddDrum}
        onRemove={@onRemoveDrum}
      />
      <Drum drum={activeDrum} onChange={updateDrum}/>
    </div>