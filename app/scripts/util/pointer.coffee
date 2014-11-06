nextId = 0
actions = {}

apply = ->
  max = null

  for id, action of actions
    max = id if !max? or action.priority > actions[max].priority

  document.body.style.cursor = if max then actions[max].value else 'default'


module.exports =

  set: (value, priority, id) ->
    id ||= nextId += 1
    actions[id] = {value, priority}
    apply()

    id

  clear: (id) ->
    delete actions[id]
    apply()
