# @cjsx React.DOM

React = require 'react/addons'
Updatable = require './mixins/updatable'
Sortable = require './mixins/sortable'
Modelable = require './mixins/modelable'
Knob = require './knob'
Slider = require './slider'
ListControl = require './list_control'
SampleControl = require './sample_control'
Envelope = require './envelope'
keyOptions = require '../util/key_options'
transposeOptions = require '../util/transpose_options'


Drum = React.createClass

  mixins: [Sortable, Modelable]

  render: ->
    drum = @props.drum

    return <div className="drum"/> unless drum

    <div className="drum">
      <div className="column">
        <SampleControl
          label={"Sample"}
          app={@props.app}
          sampler={drum}
        />
      </div>
      <div className="column envelope">
        <Envelope
          label="Volume Env"
          env={drum.cursor('volumeEnv')}
        />
      </div>
      <div className="column control">
        <Knob
          label="Level"
          value={drum.get 'level'}
          onChange={@updateCursor drum, 'level'}
        />
        <div className="ui">
          <select
            value={drum.get 'transpose'}
            onChange={@updateCursor drum, 'transpose', (e) -> parseInt e.target.value}
          >
            {transposeOptions()}
          </select>
          <label>Transpose</label>
        </div>
        <div className="ui">
          <select
            value={drum.get 'key'}
            onChange={@updateCursor drum, 'key', (e) -> parseInt e.target.value}
          >
            {keyOptions()}
          </select>
          <label>Trigger</label>
        </div>
      </div>
    </div>


module.exports = React.createClass

  mixins: [Updatable, Modelable]

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
          onChange={@updateCursor instrument, 'level'}
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