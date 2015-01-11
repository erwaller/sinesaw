Model = require './model'


module.exports = class Song extends Model

  @defaults:
    name: 'New Song'
    bpm: 120
    level: 1
    tracks: []
