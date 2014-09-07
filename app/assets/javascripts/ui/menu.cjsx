React = require 'react'

module.exports = React.createClass
  
  onClickOption: (e) ->
    e.stopPropagation()
    @props.onSelect e.target.dataset.option

  render: ->
    options = for option, i in @props.options
      do (option) =>
        <div key={i} className="option" onClick={@onClickOption} data-option={option}>{option}</div>

    <div className="ui menu" style={{display: if @props.open then 'block' else 'none'}}>{options}</div>
