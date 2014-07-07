class @AnalogSynthesizer extends Model

  tau = Math.PI * 2
  tune = 440
  sampleRate = 48000
  minEnvValue = 0.01


  oscillators =

    sine: (time, frequency) ->
      Math.sin time * tau * frequency

    square: (time, frequency) ->
      if ((time % (1 / frequency)) * frequency) % 1 > 0.5 then 1 else -1

    saw: (time, frequency) ->
      1 - 2 * (((time % (1 / frequency)) * frequency) % 1)


  filters =

    LP: do ->

      y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0
      p = k = t1 = t2 = r = x = null

      (sample, cutoff, res) ->
        res = res / 2
        freq = 20 * Math.pow 10, 3 * cutoff
        freq = 2 * freq / sampleRate
        p = freq * (1.8 - (0.8 * freq))
        k = 2 * Math.sin(freq * Math.PI / 2) - 1
        t1 = (1 - p) * 1.386249
        t2 = 12 + t1 * t1
        r = res * (t2 + 6 * t1) / (t2 - 6 * t1)

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

    HP: (sample, cutoff, res) ->
      sample

    none: (sample) -> sample


  frequency = (key) ->
    tune * Math.pow 2, (key - 69) / 12


  envelope = (env, note, time) ->
    elapsed = time - note.time
    a = Math.max minEnvValue, env.a
    d = Math.max minEnvValue, env.d
    s = env.s
    r = Math.max minEnvValue, env.r

    # attack, decay, sustain
    l = if elapsed > a + d
      l = s
    else if elapsed > a
      l = s + (1 - s) * (a + d - elapsed) / d
    else
      elapsed / a

    # release
    if elapsed > note.len
      l = l * (r + note.len - elapsed) / r

    Math.max 0, l


  defaults:
    level: 0.5
    pan: 0.5
    polyphony: 3
    volumeEnv:
      a: 0.1
      d: 0.2
      s: 0.2
      r: 0.05
    filterEnv:
      a: 0
      d: 0.5
      s: 0
      r: 0.5
    filter:
      type: 'LP'
      freq: 0.2
      res: 0.7
      env: 0.4
    osc1:
      waveform: 'saw'
      level: 0.5
      pitch: 0
      tune: 0.51
    osc2:
      waveform: 'saw'
      level: 0.5
      pitch: 1
      tune: 0.5


  constructor: ->
    super
    @notes = []


  reset: ->
    @notes = []


  out: (time) =>

    # sum all active notes
    @state.level * @notes.reduce((memo, note) =>
      
      # sum oscillators and apply volume envelope
      osc1Freq = frequency note.key + @state.osc1.tune - 0.5 + Math.round(24 * (@state.osc1.pitch - 0.5))
      osc2Freq = frequency note.key + @state.osc2.tune - 0.5 + Math.round(24 * (@state.osc2.pitch - 0.5))
      sample = envelope(@state.volumeEnv, note, time) * (
        @state.osc1.level * oscillators[@state.osc1.waveform](time, osc1Freq) +
        @state.osc2.level * oscillators[@state.osc2.waveform](time, osc2Freq)
      )

      # apply filter with envelope
      filterCutoff = Math.min 1, @state.filter.freq + @state.filter.env * envelope(@state.filterEnv, note, time)
      sample = filters[@state.filter.type] sample, filterCutoff, @state.filter.res

      # return result
      memo + sample

    , 0)


  tick: (time, beat, bps, notesOn) =>

    # prune finished notes
    @notes = @notes.filter (note) =>
      note.len + @state.volumeEnv.r > time - note.time

    # add new notes
    notesOn.forEach (note) =>
      @notes.push {time, key: note.key, len: note.length / bps}
      @notes.shift() if @notes.length > @state.polyphony

