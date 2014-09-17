Model = require './model'

module.exports = class Instrument extends Model

  toJSON: ->
    result = {}
    result[k] = v for k, v of @state
    result