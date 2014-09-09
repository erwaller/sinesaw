(function(){
  var React = require('react');
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

  // load webfonts and mount app
  // WebFont.load({
  //   google: {
  //     families: ['Roboto:300:latin']
  //   },
  //   active: function(){
  //     React.renderComponent(App(), document.body);
  //   }
  // });

  var fs = require('fs');
  var b2a = require('base64-arraybuffer');
  var file = b2a.decode(fs.readFileSync(__dirname + '/../audio/test.wav', 'base64'));
  var decoder = new webkitAudioContext();
  decoder.decodeAudioData(file, function(buffer) {
    var data = buffer.getChannelData(0);
    
    BasicSampler.prototype.defaults.sampleData = data
    BasicSampler.prototype.defaults.sampleName = 'test.wav'

    window.song = new Song();
    
    song.set({tracks: [
      // new Track({name: 'Drum Sampler'}, new DrumSampler()),
      // new Track({name: 'Drum Synth'}, new DrumkitSynthesizer()),
      new Track({name: 'Basic Sampler'}, new BasicSampler()),
      // new Track({name: 'Loop Sampler'}, new LoopSampler()),
      // new Track({name: 'Analog Synth'}, new AnalogSynthesizer())
    ]});

    setTimeout(function(){
      React.renderComponent(App({song: song}), document.body);
    });

  });

})();