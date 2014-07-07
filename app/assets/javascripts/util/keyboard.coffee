@Keyboard =

  callbacks: {}

  pressed: {}

  on: (key, fn) ->
    @callbacks[key] ||= []
    @callbacks[key].push fn

  off: (key, fn) ->
    i = @callbacks[key].indexOf fn
    @callbacks[key].splice i, 1 if i >= 0

window.addEventListener 'keydown', (e) ->
  Keyboard.pressed[e.keyCode] = true

window.addEventListener 'keyup', (e) ->
  Keyboard.pressed[e.keyCode] = false

window.addEventListener 'keypress', (e) ->
  e.preventDefault()
  fn e for fn in Keyboard.callbacks[e.keyCode]
