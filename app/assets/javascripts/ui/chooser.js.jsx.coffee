###* @jsx React.DOM ###

@Chooser = React.createClass

  onClickValue: (e) ->
    @props.onChange e.target.dataset.value

  render: ->
    options = for v, i in @props.options
      className = 'option'
      className += ' selected' if v == @props.value
      `<div key={i} className={className} onClick={this.onClickValue} data-value={v}>{v}</div>`

    `<div className="ui chooser">
      {options}
    </div>`