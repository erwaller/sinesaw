module.exports = class Sequence

  @notesOn: (sequence, beat, lastBeat) ->
    bar = Math.floor beat / sequence.loopSize
    lastBar = Math.floor lastBeat / sequence.loopSize
    beat = beat % sequence.loopSize
    lastBeat = lastBeat % sequence.loopSize

    result = []
    for id, note of sequence.notes
      if note.start < beat and (note.start >= lastBeat or bar > lastBar)
        result.push note

    result
