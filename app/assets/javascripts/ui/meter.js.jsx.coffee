###* @jsx React.DOM ###

@Meter = React.createClass

  mixins: [Modelable('track')]

  getDefaultProps: ->
    steps: 6

  render: ->
    level = Math.ceil(@state.meterLevel * @props.steps)
    steps = for i in [1..@props.steps]
      className = if i <= level then 'on' else ''
      `<div key={i} className={className}/>`

    `<div className="ui meter">
      {steps}
    </div>`

  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps != @props or
    Math.ceil(@state.meterLevel * @props.steps) != Math.ceil(nextState.meterLevel * @props.steps)