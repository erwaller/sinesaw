(function(){
  window.React = require('react');
  window.Modal = require('./ui/modal');
  var App = require('./app');

  var Song = require('./models/song');
  var Track = require('./models/track');
  var AnalogSynthesizer = require('./models/analog_synthesizer');
  var BasicSampler = require('./models/basic_sampler');
  var DrumSampler = require('./models/drum_sampler');
  var DrumkitSynthesizer = require('./models/drumkit_synthesizer');
  var LoopSampler = require('./models/loop_sampler');

  // // inject request animation frame batching strategy into react
  // require('react-raf-batching').inject()

  var async = require('async');
  var fs = require('fs');
  var b2a = require('base64-arraybuffer');
  var bass = b2a.decode(fs.readFileSync(__dirname + '/../audio/bass.wav', 'base64'));
  var kick = b2a.decode(fs.readFileSync(__dirname + '/../audio/kick.wav', 'base64'));
  var snare = b2a.decode(fs.readFileSync(__dirname + '/../audio/snare.wav', 'base64'));
  var hat = b2a.decode(fs.readFileSync(__dirname + '/../audio/hat.wav', 'base64'));
  var decoder = new webkitAudioContext();

  async.parallel({
    bass: function(cb) { decoder.decodeAudioData(bass, function(buffer) { cb(null, buffer) }); },
    kick: function(cb) { decoder.decodeAudioData(kick, function(buffer) { cb(null, buffer) }); },
    snare: function(cb) { decoder.decodeAudioData(snare, function(buffer) { cb(null, buffer) }); },
    hat: function(cb) { decoder.decodeAudioData(hat, function(buffer) { cb(null, buffer) }); }
  }, function(err, results) {

    BasicSampler.prototype.defaults.sampleData = results.bass.getChannelData(0);
    BasicSampler.prototype.defaults.sampleName = 'test.wav';
    DrumSampler.prototype.defaults.drums = [
      {
        name: 'Kick',
        sampleData: results.kick.getChannelData(0),
        sampleName: 'kick.wav',
        transpose: 0,
        level: 1,
        key: 0,
        start: 0,
        volumeEnv: {
          a: 0,
          d: 1,
          s: 1,
          r: 1
        }
      }, {
        name: 'Snare',
        sampleData: results.snare.getChannelData(0),
        sampleName: 'snare.wav',
        transpose: 0,
        level: 0.35,
        key: 1,
        start: 0,
        volumeEnv: {
          a: 0,
          d: 1,
          s: 1,
          r: 1
        }
      }, {
        name: 'High Hat',
        sampleData: results.hat.getChannelData(0),
        sampleName: 'hat.wav',
        transpose: 0,
        level: 0.2,
        key: 2,
        start: 0,
        volumeEnv: {
          a: 0,
          d: 1,
          s: 1,
          r: 1
        }
      },
    ];

    window.song = new Song();
    
    song.set({tracks: [
      new Track({name: 'Basic Sampler'}, new BasicSampler()),
      new Track({name: 'Drum Sampler'}, new DrumSampler()),
      // new Track({name: 'Drum Synth'}, new DrumkitSynthesizer()),
      // new Track({name: 'Loop Sampler'}, new LoopSampler()),
      // new Track({name: 'Analog Synth'}, new AnalogSynthesizer())
    ]});

    setTimeout(function(){
      React.renderComponent(App({song: song}), document.body);
    });

  });

})();