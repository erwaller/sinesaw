###* @jsx React.DOM ###

@Chooser = React.createClass

  getInitialState: ->
    selected: 0

  render: ->
    values = @props.values.map (v, i) =>
      className = 'value'
      className += ' selected' if i == @state.selected
      `<div className={className}>{v}</div>`

    `<div className="ui chooser">
      {values}
    </div>`