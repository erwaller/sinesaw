# @cjsx React.DOM

React = require 'react'
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

  setSample: (sampleName, sampleData) ->
    # o = {}
    # o[k] = v for k, v of @props.drum

    # o.sampleName = sampleName
    # o.sampleData = sampleData

    # @props.onChange o

  render: ->
    drum = @props.drum

    return <div className="drum"/> unless drum

    console.log "HERE"
    console.log drum
    console

    <div className="drum">
      <div className="column">
        <SampleControl
          label={"Sample"}
          app={@props.app}
          onChange={@setSample}
          sampleData={drum.get 'sampleData'}
          sampleName={drum.get 'sampleName'}
          sampleStart={drum.get 'start'}
          onChangeStart={->}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={drum.get('volumeEnv').toJS()}
          onChange={->}
        />
      </div>
      <div className="column control">
        <Knob
          label="Level"
          value={drum.get 'level'}
          onChange={->}
        />
        <div className="ui">
          <select
            value={drum.get 'transpose'}
            onChange={->}
          >
            {transposeOptions()}
          </select>
          <label>Transpose</label>
        </div>
        <div className="ui">
          <select
            value={drum.get 'key'}
            onChange={->}
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
    # @props.instrument.addDrum()
    # @setState activeDrum: @props.instrument.state.drums.length - 1

  onRemoveDrum: ->
    # @props.instrument.removeDrum @state.activeDrum
    # @setState activeDrum: Math.min @state.activeDrum, @props.instrument.state.drums.length - 1

  render: ->
    instrument = @props.instrument
    activeDrum = instrument.cursor ['drums', @state.activeDrum]

    <div className="ui drum-sampler">
      <div className="column channel">
        <Slider
          label="Level"
          value={instrument.get 'level'}
          onChange={->}
        />
      </div>
      <ListControl
        options={instrument.get 'drums'}
        selectedIndex={@state.activeDrum}
        onSelect={@update 'activeDrum'}
        onAdd={@onAddDrum}
        onRemove={@onRemoveDrum}
        onSort={->}
      />
      <Drum drum={activeDrum} app={@props.app}/>
    </div>