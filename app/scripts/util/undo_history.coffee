debounce = require './debounce'

module.exports = class UndoHistory

  constructor: (@size = 100, @interval = 300) ->
    @undos = []
    @redos = []
    @cursor = null
    @data = null
    @record = debounce @interval, =>
      @undos.push @cursor.get()

  update: (newCursor) ->
    return if @cursor is newCursor
    @cursor = newCursor
    @data = @cursor.get()
    @record()

  undo: ->
    console.log 'here'
    return unless @undos.length > 0
    @redos.push @data
    @redos.shift() if @redos.length > @size
    console.log @data
    @data = @undos.pop()
    console.log @data
    @cursor.set @data

  redo: ->
    return unless @redos.length > 0
    @undos.push @data
    @undos.shift() if @undos.length > @size
    @data = @redos.pop()
    @cursor.set @data
