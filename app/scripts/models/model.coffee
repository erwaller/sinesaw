Immutable = require 'immutable'
cuid = require 'cuid'


module.exports = class Model

  # default attributes
  @defaults: {}

  @build: (data = {}) ->
    data._id = cuid() unless data._id?
    Immutable.fromJS(@defaults).mergeDeep Immutable.fromJS data
