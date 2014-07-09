###* @jsx React.DOM ###

Drum = React.createClass

  update: (key) ->
    (value) =>
      o = {}
      for k, v of @props.drum
        o[k] = if k == key then value else v
      @props.onChange o

  render: ->
    `<div className='drum'>
      <div className='column'>
        <Knob
          label="Level"
          value={this.props.drum.level}
          onChange={this.update('level')}
        />
        <Knob
          label="Pan"
          value={this.props.drum.pan}
          onChange={this.update('pan')}
        />
        <Knob
          label="Decay"
          value={this.props.drum.decay}
          onChange={this.update('decay')}
        />
        <Knob
          label="Noise"
          value={this.props.drum.noise}
          onChange={this.update('noise')}
        />
        <Knob
          label="Pitch"
          value={this.props.drum.pitch}
          onChange={this.update('pitch')}
        />
        <Knob
          label="Bend"
          value={this.props.drum.bend}
          onChange={this.update('bend')}
        />
      </div>
      <label>{this.props.drum.name}</label>
    </div>`

@Drumkit = React.createClass

  mixins: [Modelable('instrument')]

  render: ->
    drums = for i in [0...5]
      key = "drum#{i}"
      drum = @props.instrument.state[key]
      `<Drum key={i} drum={drum} onChange={this.props.instrument.createSetterFor(key)}/>`

    `<div className="ui drumkit">
      <div className="column channel">
        <Slider
          label="Level"
          value={this.state.level}
          onChange={this.props.instrument.createSetterFor('level')}
        />
        <Knob
          label="Pan"
          value={this.state.pan}
          onChange={this.props.instrument.createSetterFor('pan')}
        />
      </div>
      {drums}
    </div>`