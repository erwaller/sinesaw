@SizeMeasurable =

  getInitialState: ->
    height: 0
    width: 0

  updateDimensions: (e) ->
    el = @refs.container.getDOMNode()

    @setState
      width: el.clientWidth
      height: el.clientHeight

  componentDidMount: ->
    @updateDimensions()
    window.addEventListener 'resize', @updateDimensions

  componentWillUnmount: ->
    window.removeEventListener 'resize', @updateDimensions


@Updatable =
  
  update: (prop) ->
    (value) =>
      obj = {}
      obj[prop] = value
      @setState obj

  updateTo: (values) ->
    => @setState values


@Draggable =

  draggableOnMouseDown: (e) ->
    window.addEventListener 'mousemove', @draggableOnMouseMove
    window.addEventListener 'mouseup', @draggableOnMouseUp
    @dragStartPosition = x: e.clientX, y: e.clientY
    @onDragStart?(@dragStartPosition)

  draggableOnMouseMove: (e) ->
    x = @dragStartPosition.x - e.clientX
    y = @dragStartPosition.y - e.clientY
    @onDrag?({x,y})

  draggableOnMouseUp: ->
    window.removeEventListener 'mousemove', @draggableOnMouseMove
    window.removeEventListener 'mouseup', @draggableOnMouseUp
    @mouseDownPosition = null
    @initialValue = null
    @onDragEnd?()