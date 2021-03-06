tau = Math.PI * 2

module.exports =

  sine: (time, frequency) ->
    Math.sin time * tau * frequency

  square: (time, frequency) ->
    if ((time % (1 / frequency)) * frequency) % 1 > 0.5 then 1 else -1

  saw: (time, frequency) ->
    1 - 2 * (((time % (1 / frequency)) * frequency) % 1)

  noise: ->
    2 * Math.random() - 1