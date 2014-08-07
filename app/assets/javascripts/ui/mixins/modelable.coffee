module.exports = (name = 'model') ->

  getInitialState: ->
    @props[name].state

  componentDidMount: ->
    @props[name].addComponent this

  componentWillUnmount: ->
    @props[name].removeComponent this

  componentWillReceiveProps: (nextProps) ->
    if nextProps != @props
      @props[name].removeComponent this
      nextProps[name].addComponent this

    @setState nextProps[name].state
