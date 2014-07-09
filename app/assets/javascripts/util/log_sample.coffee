i = 0
@logSample = (v) ->
  console.log(v) if i == 0
  i = (i + 1) % 10000
