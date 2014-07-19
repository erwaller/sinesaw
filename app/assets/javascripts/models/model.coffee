class @Model

  defaults: {}

  constructor: (@state={}) ->
    @state[k] ||= v for k, v of @defaults
    @components = []

  set: (attrs) ->
    @state[k] = v for k, v of attrs
    @update()

  createSetter: (attrs) ->
    => @set attrs

  createSetterFor: (attr) ->
    (value) =>
      o = {}
      o[attr] = value
      @set o

  createBindingFor: (attr) ->
    (e) =>
      console.log 'binding running'
      e.stopPropagation()
      o = {}
      o[attr] = e.target.value
      @set o

  addComponent: (component) ->
    i = @components.indexOf component
    @components.push component if i < 0

  removeComponent: (component) ->
    i = @components.indexOf component
    @components.splice i, 1

  update: ->
    component.setState @state for component in @components