debounce = require './debounce'

module.exports = class UndoHistory

  defaultSize: 100
  defaultInterval: 200

  constructor: (@data, @onChange, @size, @interval) ->
    @size ||= @defaultSize
    @interval ||= @defaultInterval
    @undos = []
    @redos = []
    @lastData = null

    @record = debounce @interval, =>
      @undos.push @lastData if @lastData?
      @lastData = null

  update: (newData) ->
    return if @data is newData
    @lastData ||= @data
    @data = newData
    @record()

  undo: ->
    return unless @undos.length > 0
    @redos.push @data
    @redos.shift() if @redos.length > @size
    @data = @undos.pop()
    @onChange @data

  redo: ->
    return unless @redos.length > 0
    @undos.push @data
    @undos.shift() if @undos.length > @size
    @data = @redos.pop()
    @onChange @data
