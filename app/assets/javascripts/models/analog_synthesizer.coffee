class @AnalogSynthesizer extends Model

  tau = Math.PI * 2
  tune = 440
  minEnvValue = 0.01

  defaults:
    level: 0.5
    pan: 0.5
    polyphony: 8
    volumeEnv:
      a: 0.1
      d: 0.2
      s: 0.2
      r: 0.05
    filterEnv:
      a: 0
      d: 0.5
      s: 0.5
      r: 0.5
    filter:
      type: 'LP'
      freq: 1
      res: 0
      env: 0.5
    osc1:
      waveform: 'Sin'
      level: 0.5
      pitch: 0.5
      tune: 0.5
    osc2:
      waveform: 'Sin'
      level: 0.5
      pitch: 0.5
      tune: 0.5

  constructor: ->
    super
    @notes = []

  setVolumeEnv: (attrs) =>
    volumeEnv = {}
    for k, v of @state.volumeEnv
      volumeEnv[k] = Math.max minEnvValue, (attrs[k] or v)
    @set {volumeEnv}

  frequency: (key) ->
    tune * Math.pow 2, (key - 69) / 12

  envelope: (note, time) ->
    elapsed = time - note.time
    env = @state.volumeEnv

    l = if elapsed > env.a + env.d
      l = env.s
    else if elapsed > env.a
      l = env.s + (1 - env.s) * (env.a + env.d - elapsed) / env.d
    else
      elapsed / env.a

    # console.log note.len, elapsed
    if elapsed > note.len
      l = l * (env.r + note.len - elapsed) / env.r

    Math.max 0, l

  out: (time) =>
    @state.level * @notes.reduce((memo, note) =>
      memo + @envelope(note, time) * Math.sin(time * tau * @frequency(note.key))
    , 0)

  tick: (time, beat, bps, notesOn) =>
    # prune finished notes
    @notes = @notes.filter (note) =>
      note.len + @state.volumeEnv.r > time - note.time

    # add new notes
    notesOn.forEach (note) =>
      @notes.push {time, key: note.key, len: note.length / bps}
      @notes.shift() if @notes.lengt > @state.polyphony

  reset: ->
    @notes = []