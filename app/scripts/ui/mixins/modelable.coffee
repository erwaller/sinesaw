identity = (v) -> v

capitalize = (s) -> s.charAt(0).toUpperCase() + s.slice 1

immutableEqual = (objA, objB) ->

  return true if objA is objB

  # Test for A's keys different from B.
  for key of objA
    if objA.hasOwnProperty key
      return false unless objB.hasOwnProperty key
      return false if objA[key] isnt objB[key]

      # # if objects are cursors, dereference before comparing
      # if objA[key]?.deref?
      #   return false if objA[key].deref() isnt objB[key].deref()
      
      # #otherwise test for strict equality
      # else
      #   return false if objA[key] isnt objB[key]

  # Test for B's keys missing from A.
  for key of objB
    if objB.hasOwnProperty(key)
      return false unless objA.hasOwnProperty(key)
  
  true



module.exports =

  shouldComponentUpdate: (nextProps, nextState) ->
    !immutableEqual(@props, nextProps) or !immutableEqual(@state, nextState)

  updateCursor: (cursor, attr, updator = identity) ->
    (v) ->
      cursor.update (data) ->
        data.set attr, updator v