i = 0
module.exports = (v) ->
  console.log(v) if i == 0
  i = (i + 1) % 7000
