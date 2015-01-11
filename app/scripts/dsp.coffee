Song = require './models/song.coffee'

song = new Song

console.log 'in worker script'

self.onmessage = (e) ->

  switch e.data.type
    when 'update'
      song.update e.data.state
    when 'buffer'
      song.buffer e.data.size, e.data.index, e.data.sampleRate, (buffer) ->
        postMessage
          type: 'buffer'
          buffer: buffer
        , [buffer]

setInterval ->
  song.processFrame()
  postMessage
    type: 'frame'
    frame: song.getState()

, 1000 / 60
