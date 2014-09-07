# @cjsx React.DOM

React = require 'react/addons'
Sortable = require './mixins/sortable'

ListOption = React.createClass

  mixins: [Sortable, React.addons.PureRenderMixin]

  render: ->
    className = 'option'
    className += ' selected' if @props.selected
    className += ' dragging' if @isDragging()

    <div
      className={className}
      onClick={@props.selectOption}
      draggable={true}
      onDragStart={@dragStart}
      onDragEnd={@dragEnd}
      onDragOver={@dragOver}
      data-id={@props.key}
    >
      {@props.name}
    </div>



module.exports = React.createClass

  mixins: [React.addons.PureRenderMixin]

  getInitialState: ->
    dragging: null

  onRemove: ->
    @props.onRemove @props.selectedIndex

  sort: (items, dragging) ->
    @props.onSort items
    @props.onSelect dragging if dragging?
    @setState {dragging}

  render: ->
    options = @props.options.map (option, i) =>
      <ListOption
        key={i}
        name={option.name}
        selected={i == @props.selectedIndex}
        selectOption={=> @props.onSelect i}
        sort={@sort}
        items={@props.options}
        dragging={@state.dragging}
      />
    
    <div className="ui list-control">
      <div className="list">
        {options}
      </div>
      <div className="controls">
        <div className="icon icon-plus pull-right" onClick={@props.onAdd}></div>
        <div className="icon icon-minus pull-left" onClick={@onRemove}></div>
      </div>
    </div>
