Model = require './model'
Sequence = require './sequence'


module.exports = class Track extends Model

  @defaults: ->
    name: 'Track'
    sequence: Sequence.build()
    effects: []
