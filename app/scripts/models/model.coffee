deepMerge = require '../util/deep_merge'
cuid = require 'cuid'


module.exports = class Model

  # default attributes
  @defaults: {}

  @build: (data = {}) ->
    data._id = cuid() unless data._id?
    deepMerge @defaults, data
