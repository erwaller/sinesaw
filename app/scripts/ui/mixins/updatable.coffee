module.exports =
  
  update: (prop) ->
    (value) =>
      obj = {}
      obj[prop] = value
      @setState obj

  updateTo: (values) ->
    => @setState values
