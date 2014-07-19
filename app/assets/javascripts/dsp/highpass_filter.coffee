sampleRate = 48000
maxFreq = 12000
dbGain = 12    # gain of filter
bandwidth = 1  # bandwidth in octaves

# constants
A = Math.pow(10, dbGain / 40)
e = Math.log(2)
tau = 2 * Math.PI
beta = Math.sqrt(2 * A)

# hyperbolic sin function
sinh = (x) ->
  y = Math.exp x
  (y - 1 / y) / 2

@highpassFilter = ->
  a0 = a1 = a2 = a3 = a4 = x1 = x2 = y1 = y2 = 0
  freq = omega = sn = alpha = 0
  cs = 1

  lastCutoff = 0

  (sample, cutoff) ->
    # cache filter values until cutoff changes
    if cutoff != lastCutoff
  
      oldCutoff = cutoff

      freq = cutoff * maxFreq
      omega = tau * freq / sampleRate
      sn = Math.sin omega
      cs = Math.cos omega
      alpha = sn * sinh(e / 2 * bandwidth * omega / sn)

      b0 = (1 + cs) / 2
      b1 = -(1 + cs)
      b2 = (1 + cs) / 2
      aa0 = 1 + alpha
      aa1 = -2 * cs
      aa2 = 1 - alpha

      a0 = b0 / aa0
      a1 = b1 / aa0
      a2 = b2 / aa0
      a3 = aa1 / aa0
      a4 = aa2 / aa0

    # compute result
    s = Math.max -1, Math.min 1, sample
    result = a0 * s + a1 * x1 + a2 * x2 - a3 * y1 - a4 * y2

    # shift x1 to x2, sample to x1
    x2 = x1
    x1 = s

    # shift y1 to y2, result to y1
    y2 = y1
    y1 = result

    result