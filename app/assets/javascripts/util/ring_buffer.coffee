class @RingBuffer
  
  constructor: (@length) ->
    @array = new Float32Array @length
    @pos = 0

  push: (el) ->
    @array[@pos] = el
    @pos += 1
    @pos = 0 if @pos == @length

  forEach: (fn) ->
    fn @array[i] for i in [@pos...@length]
    fn @array[i] for i in [0...@pos]

  reduce: (fn, memo = 0) ->
    @forEach (el) ->
      memo = fn memo, el
    memo
