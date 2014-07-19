sampleRate = 48000

@lowpassFilter = ->

  y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0
  p = k = t1 = t2 = r = x = null

  (sample, cutoff, res) ->
    freq = 20 * Math.pow 10, 3 * cutoff
    freq = freq / sampleRate
    p = freq * (1.8 - (0.8 * freq))
    k = 2 * Math.sin(freq * Math.PI / 2) - 1
    t1 = (1 - p) * 1.386249
    t2 = 12 + t1 * t1
    r = res * 0.57 * (t2 + 6 * t1) / (t2 - 6 * t1)

    x = sample - r * y4

    # four cascaded one-pole filters (bilinear transform)
    y1 =  x * p + oldx  * p - k * y1
    y2 = y1 * p + oldy1 * p - k * y2
    y3 = y2 * p + oldy2 * p - k * y3
    y4 = y3 * p + oldy3 * p - k * y4

    # clipper band limited sigmoid
    y4 -= (y4 * y4 * y4) / 6

    oldx = x
    oldy1 = y1
    oldy2 = y2
    oldy3 = y3

    y4