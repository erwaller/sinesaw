identity = (v) -> v

capitalize = (s) -> s.charAt(0).toUpperCase() + s.slice 1

immutableEqual = (objA, objB) ->

  return true if objA is objB

  # Test for A's keys different from B.
  for key of objA
    if objA.hasOwnProperty key
      return false unless objB.hasOwnProperty key

      # if objects are cursors, dereference before comparing
      if objA[key].deref?
        return false if objA[key].deref() isnt objB[key].deref()
      
      #otherwise test for strict equality
      else
        return false if objA[key] isnt objB[key]

  # Test for B's keys missing from A.
  for key of objB
    if objB.hasOwnProperty(key)
      return false unless objA.hasOwnProperty(key)
  
  true



module.exports = ->

  mixin =
    shouldComponentUpdate: (nextProps, nextState) ->
      !immutableEqual(@props, nextProps) or !immutableEqual(@state, nextState)

  for model in arguments
    do (model) ->
      mixin["update#{capitalize model}"] = (path, updator = identity) ->
        c = @props[model].cursor path
        (value) ->
          c.update (oldValue) ->
            updator value, oldValue

  mixin
