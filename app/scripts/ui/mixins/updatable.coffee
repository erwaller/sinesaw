module.exports =
  
  update: (prop, pre) ->
    (value) =>
      obj = {}
      obj[prop] = if pre then pre(value) else value
      @setState obj

  updateTo: (values) ->
    => @setState values
