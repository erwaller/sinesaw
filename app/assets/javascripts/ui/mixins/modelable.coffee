@Modelable = (name = 'model') ->

  getInitialState: ->
    @props[name].state

  componentDidMount: ->
    @props[name].addComponent this

  componentWillUnmount: ->
    @props[name].removeComponent this