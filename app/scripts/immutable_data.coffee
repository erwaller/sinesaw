module.exports = 

  create: (inputData, onChange, historySize = 100) ->
    data = inputData
    undos = []
    redos = []
    cache = {}

    class Cursor

      constructor: (@path = []) ->

      cursor: (path = []) ->
        path = [path] unless path instanceof Array
        new Cursor @path.concat path

      get: (path = []) ->
        path = [path] unless path instanceof Array
        target = data
        target = target[key] for key in @path.concat path
        target

      deref: ->
        target = data
        target = target[key] for key in @path
        target

      set: (path, value) ->
        path = [path] unless path instanceof Array

        target = data
        for key in (@path.concat path).slice 0, -1
          updated = {}
          updated[k] = v for k, v of target[key]
          target = target[key] = updated

        target[path.slice -1] = value

        onChange data

      bind: (path, pre) ->
        (v) => @set path, if pre? then pre v else v


    undo: ->
      return unless undos.length > 0
      redos.push data
      redos.shift() if redos.length > historySize
      data = undos.pop()
      onChange data

    redo: ->
      return unless redos.length > 0
      undos.push data
      undos.shift() if undos.length > historySize
      data = redos.pop()
      onChange data

    cursor: (path) -> new Cursor path
