class @DrumkitSynthesizer extends Model

  minFreq = 60
  maxFreq = 5000
  freqScale = maxFreq - minFreq

  defaults:
    level: 0.5
    pan: 0.5
    drum0:
      name: 'Kick'
      level: 0.8
      pan: 0.5
      decay: 0.3
      noise: 0.01
      pitch: 0
      bend: 0.4
      fm: 0
      fmDecay: 0
      hp: 0
    drum1:
      name: 'Snare'
      level: 0.5
      pan: 0.5
      decay: 0.1
      noise: 0.8
      pitch: 0.1
      bend: 0.5
      fm: 0
      fmDecay: 0
      hp: 0
    drum2:
      name: 'HH1'
      level: 0.2
      pan: 0.5
      decay: 0.05
      noise: 1
      pitch: 0.5
      bend: 0.5
      fm: 0
      fmDecay: 0
      hp: 0
    drum3:
      name: 'HH2'
      level: 0.2
      pan: 0.5
      decay: 0.3
      noise: 1
      pitch: 0.5
      bend: 0.5
      fm: 0
      fmDecay: 0
      hp: 0
    drum4:
      name: 'Perc'
      level: 0.3
      pan: 0.5
      decay: 0.1
      noise: 0.05
      pitch: 0.1
      bend: 0.45
      fm: 0
      fmDecay: 0
      hp: 0

  mapping: [
    'drum0'
    'drum1'
    'drum2'
    'drum3'
    'drum4'
  ]

  constructor: ->
    super
    @notes = {}

  reset: ->
    @notes = {}

  out: (time) ->
    return 0 if @state.level == 0

    # sum all active notes
    @state.level * @mapping.reduce((memo, drumName, index) =>
      return memo unless @notes[index]?
      drum = @state[drumName]
      elapsed = time - @notes[index]
      return memo if elapsed > drum.decay

      level = drum.level * simpleEnvelope drum.decay, elapsed
      freq = minFreq + drum.pitch * freqScale

      memo + level * (
        (1 - drum.noise) * oscillators.sine(time, freq) +
        drum.noise * oscillators.noise()
      )
    , 0)

  tick: (time, i, beat, bps, notesOn) =>
    # add new notes
    notesOn.forEach (note) =>
      @notes[note.key] = time if @mapping[note.key]?
