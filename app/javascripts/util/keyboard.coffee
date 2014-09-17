Keyboard =

  callbacks: {}
  pressed: {}
  restricted: [8, 32, 37, 38, 39, 40]

  on: (key, fn) ->
    @callbacks[key] ||= []
    @callbacks[key].push fn

  off: (key, fn) ->
    i = @callbacks[key].indexOf fn
    @callbacks[key].splice i, 1 if i >= 0



window.addEventListener 'keydown', (e) ->
  Keyboard.pressed[e.keyCode] = true

  e.preventDefault() if e.keyCode in Keyboard.restricted

  if Keyboard.callbacks[e.keyCode]?
    fn e for fn in Keyboard.callbacks[e.keyCode]

window.addEventListener 'keyup', (e) ->
  Keyboard.pressed[e.keyCode] = false

module.exports = Keyboard