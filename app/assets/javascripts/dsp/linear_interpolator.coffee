module.exports = (sampleData, transpose, samplesElapsed) ->
  i = samplesElapsed * Math.pow 2, transpose / 12
  i1 = Math.floor i
  i2 = i1 + 1
  l = i % 1

  sampleData[i1] * (1 - l) + sampleData[i2] * l