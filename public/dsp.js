(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Song, song;

Song = require('./models/song.coffee');

song = new Song;

console.log('in worker script');

self.onmessage = function(e) {
  switch (e.data.type) {
    case 'update':
      return song.update(e.data.state);
    case 'buffer':
      return song.buffer(e.data.size, e.data.index, e.data.sampleRate, function(buffer) {
        return postMessage({
          type: 'buffer',
          buffer: buffer
        }, [buffer]);
      });
  }
};

setInterval(function() {
  song.processFrame();
  return postMessage({
    type: 'frame',
    frame: song.getState()
  });
}, 1000 / 60);



},{"./models/song.coffee":16}],2:[function(require,module,exports){
var minEnvValue;

minEnvValue = 0.01;

module.exports = function(env, note, time) {
  var a, d, elapsed, l, r, s;
  elapsed = time - note.time;
  a = Math.max(minEnvValue, env.a);
  d = Math.max(minEnvValue, env.d);
  s = env.s;
  r = Math.max(minEnvValue, env.r);
  l = elapsed > a + d ? l = s : elapsed > a ? l = s + (1 - s) * (a + d - elapsed) / d : elapsed / a;
  if (elapsed > note.len) {
    l = l * (r + note.len - elapsed) / r;
  }
  return Math.max(0, l);
};



},{}],3:[function(require,module,exports){
var A, bandwidth, beta, dbGain, e, maxFreq, sampleRate, sinh, tau;

sampleRate = 48000;

maxFreq = 12000;

dbGain = 12;

bandwidth = 1;

A = Math.pow(10, dbGain / 40);

e = Math.log(2);

tau = 2 * Math.PI;

beta = Math.sqrt(2 * A);

sinh = function(x) {
  var y;
  y = Math.exp(x);
  return (y - 1 / y) / 2;
};

module.exports = function() {
  var a0, a1, a2, a3, a4, alpha, cs, freq, lastCutoff, omega, sn, x1, x2, y1, y2;
  a0 = a1 = a2 = a3 = a4 = x1 = x2 = y1 = y2 = 0;
  freq = omega = sn = alpha = 0;
  cs = 1;
  lastCutoff = 0;
  return function(sample, cutoff) {
    var aa0, aa1, aa2, b0, b1, b2, oldCutoff, result, s;
    if (cutoff !== lastCutoff) {
      oldCutoff = cutoff;
      freq = cutoff * maxFreq;
      omega = tau * freq / sampleRate;
      sn = Math.sin(omega);
      cs = Math.cos(omega);
      alpha = sn * sinh(e / 2 * bandwidth * omega / sn);
      b0 = (1 + cs) / 2;
      b1 = -(1 + cs);
      b2 = (1 + cs) / 2;
      aa0 = 1 + alpha;
      aa1 = -2 * cs;
      aa2 = 1 - alpha;
      a0 = b0 / aa0;
      a1 = b1 / aa0;
      a2 = b2 / aa0;
      a3 = aa1 / aa0;
      a4 = aa2 / aa0;
    }
    s = Math.max(-1, Math.min(1, sample));
    result = a0 * s + a1 * x1 + a2 * x2 - a3 * y1 - a4 * y2;
    x2 = x1;
    x1 = s;
    y2 = y1;
    y1 = result;
    return result;
  };
};



},{}],4:[function(require,module,exports){
module.exports = function(sampleData, transpose, samplesElapsed, offset, loopActive, loopPoint) {
  var i, i1, i2, l;
  if (offset == null) {
    offset = 0;
  }
  if (loopActive == null) {
    loopActive = false;
  }
  i = samplesElapsed * Math.pow(2, transpose / 12);
  i1 = Math.floor(i);
  if (loopActive) {
    i1 = i1 % (loopPoint - offset);
  }
  i2 = i1 + 1;
  l = i % 1;
  return sampleData[offset + i1] * (1 - l) + sampleData[offset + i2] * l;
};



},{}],5:[function(require,module,exports){
var sampleRate;

sampleRate = 48000;

module.exports = function() {
  var k, oldx, oldy1, oldy2, oldy3, p, r, t1, t2, x, y1, y2, y3, y4;
  y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0;
  p = k = t1 = t2 = r = x = null;
  return function(sample, cutoff, res) {
    var freq;
    freq = 20 * Math.pow(10, 3 * cutoff);
    freq = freq / sampleRate;
    p = freq * (1.8 - (0.8 * freq));
    k = 2 * Math.sin(freq * Math.PI / 2) - 1;
    t1 = (1 - p) * 1.386249;
    t2 = 12 + t1 * t1;
    r = res * 0.57 * (t2 + 6 * t1) / (t2 - 6 * t1);
    x = sample - r * y4;
    y1 = x * p + oldx * p - k * y1;
    y2 = y1 * p + oldy1 * p - k * y2;
    y3 = y2 * p + oldy2 * p - k * y3;
    y4 = y3 * p + oldy3 * p - k * y4;
    y4 -= (y4 * y4 * y4) / 6;
    oldx = x;
    oldy1 = y1;
    oldy2 = y2;
    oldy3 = y3;
    return y4;
  };
};



},{}],6:[function(require,module,exports){
var tau;

tau = Math.PI * 2;

module.exports = {
  sine: function(time, frequency) {
    return Math.sin(time * tau * frequency);
  },
  square: function(time, frequency) {
    if (((time % (1 / frequency)) * frequency) % 1 > 0.5) {
      return 1;
    } else {
      return -1;
    }
  },
  saw: function(time, frequency) {
    return 1 - 2 * (((time % (1 / frequency)) * frequency) % 1);
  },
  noise: function() {
    return 2 * Math.random() - 1;
  }
};



},{}],7:[function(require,module,exports){
module.exports = function(decay, elapsed) {
  if (elapsed > decay) {
    return 0;
  } else {
    return 1 - elapsed / decay;
  }
};



},{}],8:[function(require,module,exports){
var AnalogSynthesizer, Instrument, RingBuffer, envelope, highpassFilter, lowpassFilter, oscillators,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('../util/ring_buffer');

lowpassFilter = require('../dsp/lowpass_filter');

highpassFilter = require('../dsp/highpass_filter');

envelope = require('../dsp/envelope');

oscillators = require('../dsp/oscillators');

module.exports = AnalogSynthesizer = (function(_super) {
  var frequency, tune;

  __extends(AnalogSynthesizer, _super);

  function AnalogSynthesizer() {
    return AnalogSynthesizer.__super__.constructor.apply(this, arguments);
  }

  AnalogSynthesizer.defaults = {
    _type: 'AnalogSynthesizer',
    level: 0.5,
    pan: 0.5,
    polyphony: 3,
    maxPolyphony: 6,
    volumeEnv: {
      a: 0,
      d: 0.25,
      s: 0,
      r: 0.5
    },
    filterEnv: {
      a: 0,
      d: 0.25,
      s: 0.2,
      r: 0.5
    },
    filter: {
      type: 'LP',
      freq: 0.27,
      res: 0.05,
      env: 0.45
    },
    osc1: {
      waveform: 'saw',
      level: 0.5,
      pitch: 0.5,
      tune: 0.5
    },
    osc2: {
      waveform: 'saw',
      level: 0.5,
      pitch: 0.5,
      tune: 0.5
    }
  };

  AnalogSynthesizer.createState = function(state, instrument) {
    var i;
    AnalogSynthesizer.__super__.constructor.createState.call(this, state, instrument);
    return state[instrument._id].filters = {
      LP: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(lowpassFilter());
        }
        return _results;
      })(),
      HP: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(highpassFilter());
        }
        return _results;
      })(),
      none: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(function(sample) {
            return sample;
          });
        }
        return _results;
      })()
    };
  };

  tune = 440;

  frequency = function(key) {
    return tune * Math.pow(2, (key - 69) / 12);
  };

  AnalogSynthesizer.sample = function(state, instrument, time, i) {
    var r;
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    r = Math.max(0.01, instrument.volumeEnv.r);
    return instrument.level * state[instrument._id].notes.reduce((function(_this) {
      return function(memo, note, index) {
        var cutoff, filter, osc1Freq, osc2Freq, sample;
        if (note == null) {
          return memo;
        }
        if (!(note.len + r > time - note.time)) {
          return memo;
        }
        osc1Freq = frequency(note.key + instrument.osc1.tune - 0.5 + Math.round(24 * (instrument.osc1.pitch - 0.5)));
        osc2Freq = frequency(note.key + instrument.osc2.tune - 0.5 + Math.round(24 * (instrument.osc2.pitch - 0.5)));
        sample = envelope(instrument.volumeEnv, note, time) * (instrument.osc1.level * oscillators[instrument.osc1.waveform](time, osc1Freq) + instrument.osc2.level * oscillators[instrument.osc2.waveform](time, osc2Freq));
        cutoff = Math.min(1, instrument.filter.freq + instrument.filter.env * envelope(instrument.filterEnv, note, time));
        filter = state[instrument._id].filters[instrument.filter.type][index];
        sample = filter(sample, cutoff, instrument.filter.res);
        return memo + sample;
      };
    })(this), 0);
  };

  return AnalogSynthesizer;

})(Instrument);



},{"../dsp/envelope":2,"../dsp/highpass_filter":3,"../dsp/lowpass_filter":5,"../dsp/oscillators":6,"../util/ring_buffer":20,"./instrument":12}],9:[function(require,module,exports){
var BasicSampler, Instrument, RingBuffer, envelope, highpassFilter, linearInterpolator, logSample, lowpassFilter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('../util/ring_buffer');

linearInterpolator = require('../dsp/linear_interpolator');

lowpassFilter = require('../dsp/lowpass_filter');

highpassFilter = require('../dsp/highpass_filter');

envelope = require('../dsp/envelope');

logSample = require('../util/log_sample');

module.exports = BasicSampler = (function(_super) {
  __extends(BasicSampler, _super);

  function BasicSampler() {
    return BasicSampler.__super__.constructor.apply(this, arguments);
  }

  BasicSampler.defaults = {
    _type: 'BasicSampler',
    level: 0.5,
    pan: 0.5,
    polyphony: 1,
    maxPolyphony: 6,
    rootKey: 60,
    sampleData: null,
    sampleName: '',
    start: 0.3,
    loopActive: 'loop',
    loop: 0.7,
    tune: 0.5,
    volumeEnv: {
      a: 0,
      d: 0.25,
      s: 1,
      r: 0.5
    },
    filterEnv: {
      a: 0,
      d: 0.25,
      s: 1,
      r: 0.5
    },
    filter: {
      type: 'none',
      freq: 0.27,
      res: 0.05,
      env: 0.45
    }
  };

  BasicSampler.createState = function(state, instrument) {
    var i;
    BasicSampler.__super__.constructor.createState.call(this, instrument);
    return state[instrument._id].filters = {
      LP: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(lowpassFilter());
        }
        return _results;
      })(),
      HP: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(highpassFilter());
        }
        return _results;
      })(),
      none: (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = instrument.maxPolyphony; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(function(sample) {
            return sample;
          });
        }
        return _results;
      })()
    };
  };

  BasicSampler.sample = function(state, instrument, time, i) {
    var r;
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    if (instrument.sampleData == null) {
      return 0;
    }
    r = Math.max(0.01, instrument.volumeEnv.r);
    return instrument.level * state[instrument._id].notes.reduce((function(_this) {
      return function(memo, note, index) {
        var cutoff, filter, loopPoint, offset, sample, samplesElapsed, transpose;
        if (note == null) {
          return memo;
        }
        if (!(note.len + r > time - note.time)) {
          return memo;
        }
        transpose = note.key - instrument.rootKey + instrument.tune - 0.5;
        samplesElapsed = i - note.i;
        offset = Math.floor(instrument.start * instrument.sampleData.length);
        loopPoint = Math.floor(instrument.loop * instrument.sampleData.length);
        sample = linearInterpolator(instrument.sampleData, transpose, samplesElapsed, offset, instrument.loopActive === 'loop', loopPoint);
        sample = envelope(instrument.volumeEnv, note, time) * (sample || 0);
        cutoff = Math.min(1, instrument.filter.freq + instrument.filter.env * envelope(instrument.filterEnv, note, time));
        filter = state[instrument._id].filters[instrument.filter.type][index];
        sample = filter(sample, cutoff, instrument.filter.res);
        return memo + sample;
      };
    })(this), 0);
  };

  return BasicSampler;

})(Instrument);



},{"../dsp/envelope":2,"../dsp/highpass_filter":3,"../dsp/linear_interpolator":4,"../dsp/lowpass_filter":5,"../util/log_sample":19,"../util/ring_buffer":20,"./instrument":12}],10:[function(require,module,exports){
var DrumSampler, Instrument, envelope, linearInterpolator, logSample,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

envelope = require('../dsp/envelope');

linearInterpolator = require('../dsp/linear_interpolator');

logSample = require('../util/log_sample');

module.exports = DrumSampler = (function(_super) {
  __extends(DrumSampler, _super);

  function DrumSampler() {
    return DrumSampler.__super__.constructor.apply(this, arguments);
  }

  DrumSampler.defaults = {
    _type: 'DrumSampler',
    level: 0.5,
    pan: 0.5,
    drums: [
      {
        name: 'Drum 1',
        sampleData: null,
        sampleName: '',
        transpose: 0,
        level: 1,
        start: 0,
        key: 0,
        volumeEnv: {
          a: 0,
          d: 1,
          s: 1,
          r: 1
        }
      }
    ]
  };

  DrumSampler.defaultDrum = function(drums) {
    return {
      name: "Drum " + (drums.length + 1),
      sampleData: null,
      sampleName: '',
      transpose: 0,
      level: 1,
      start: 0,
      key: (function(_this) {
        return function() {
          var key;
          key = 0;
          while (drums.some(function(drum) {
              return drum.key === key;
            })) {
            key += 1;
          }
          return key;
        };
      })(this)(),
      volumeEnv: {
        a: 0,
        d: 1,
        s: 1,
        r: 1
      }
    };
  };

  DrumSampler.createState = function(state, instrument) {
    return state[instrument._id] = {
      notes: {}
    };
  };

  DrumSampler.sample = function(state, instrument, time, i) {
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    return instrument.level * instrument.drums.reduce((function(_this) {
      return function(memo, drum) {
        var note, offset, sample, samplesElapsed;
        if (drum.sampleData == null) {
          return memo;
        }
        note = state[instrument._id].notes[drum.key];
        if (note == null) {
          return memo;
        }
        samplesElapsed = i - note.i;
        offset = Math.floor(drum.start * drum.sampleData.length);
        if (samplesElapsed + offset > drum.sampleData.length) {
          return memo;
        }
        sample = linearInterpolator(drum.sampleData, drum.transpose, samplesElapsed, offset);
        return memo + drum.level * envelope(drum.volumeEnv, note, time) * (sample || 0);
      };
    })(this), 0);
  };

  DrumSampler.tick = function(state, instrument, time, i, beat, bps, notesOn) {
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    return notesOn.forEach((function(_this) {
      return function(note) {
        return state[instrument._id].notes[note.key] = {
          time: time,
          i: i,
          len: note.length / bps
        };
      };
    })(this));
  };

  return DrumSampler;

})(Instrument);



},{"../dsp/envelope":2,"../dsp/linear_interpolator":4,"../util/log_sample":19,"./instrument":12}],11:[function(require,module,exports){
var DrumSynthesizer, Instrument, cuid, highpassFilter, logSample, oscillators, simpleEnvelope,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

highpassFilter = require('../dsp/highpass_filter');

simpleEnvelope = require('../dsp/simple_envelope');

oscillators = require('../dsp/oscillators');

logSample = require('../util/log_sample');

cuid = require('cuid');

module.exports = DrumSynthesizer = (function(_super) {
  var freqScale, maxFreq, minFreq;

  __extends(DrumSynthesizer, _super);

  function DrumSynthesizer() {
    return DrumSynthesizer.__super__.constructor.apply(this, arguments);
  }

  minFreq = 60;

  maxFreq = 3000;

  freqScale = maxFreq - minFreq;

  DrumSynthesizer.defaults = {
    _type: 'DrumSynthesizer',
    level: 0.5,
    pan: 0.5,
    drums: [
      {
        key: 0,
        name: 'Kick',
        level: 1,
        hp: 0,
        decay: 0.35,
        noise: 0.001,
        pitch: 0,
        bend: 0.39,
        fm: 1,
        fmDecay: 0.05,
        fmFreq: 0.02
      }, {
        key: 1,
        name: 'Snare',
        level: 0.5,
        hp: 0.22,
        decay: 0.1,
        noise: 0.8,
        pitch: 0.1,
        bend: 0,
        fm: 0,
        fmDecay: 0,
        fmFreq: 0
      }, {
        key: 2,
        name: 'HH1',
        level: 0.05,
        hp: 1,
        decay: 0.07,
        noise: 0.8,
        pitch: 0.4,
        bend: 0,
        fm: 1,
        fmDecay: 0.4,
        fmFreq: 0
      }, {
        key: 3,
        name: 'HH2',
        level: 0.2,
        hp: 0.6,
        decay: 0.22,
        noise: 1,
        pitch: 0.5,
        bend: 0,
        fm: 0,
        fmDecay: 0,
        fmFreq: 0
      }
    ]
  };

  DrumSynthesizer.defaultDrum = function(drums) {
    return {
      key: (function(_this) {
        return function() {
          var key;
          key = 0;
          while (drums.some(function(drum) {
              return drum.key === key;
            })) {
            key += 1;
          }
          return key;
        };
      })(this)(),
      name: "Drum " + (drums.length + 1),
      level: 0.5,
      hp: 0,
      decay: 0.5,
      noise: 0.5,
      pitch: 0.5,
      bend: 0,
      fm: 0,
      fmDecay: 0,
      fmFreq: 0
    };
  };

  DrumSynthesizer.createState = function(state, instrument) {
    var i;
    return state[instrument._id] = {
      notes: {},
      filters: (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < 127; i = ++_i) {
          _results.push(highpassFilter());
        }
        return _results;
      })()
    };
  };

  DrumSynthesizer.sample = function(state, instrument, time, i) {
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    return instrument.level * instrument.drums.reduce((function(_this) {
      return function(memo, drum) {
        var elapsed, env, freq, note, sample, signal;
        note = state[instrument._id].notes[drum.key];
        if (note == null) {
          return memo;
        }
        elapsed = time - note.time;
        if (elapsed > drum.decay) {
          return memo;
        }
        env = simpleEnvelope(drum.decay, elapsed);
        freq = minFreq + drum.pitch * freqScale;
        if (drum.bend) {
          freq = (2 - drum.bend + drum.bend * env) / 2 * freq;
        }
        if (drum.fm > 0) {
          signal = oscillators.sine(elapsed, minFreq + drum.fmFreq * freqScale);
          freq += drum.fm * signal * simpleEnvelope(drum.fmDecay + 0.01, elapsed);
        }
        sample = (1 - drum.noise) * oscillators.sine(elapsed, freq) + drum.noise * oscillators.noise();
        if (drum.hp > 0) {
          sample = state[instrument._id].filters[drum.key](sample, drum.hp);
        }
        return memo + drum.level * env * sample;
      };
    })(this), 0);
  };

  DrumSynthesizer.tick = function(state, instrument, time, i, beat, bps, notesOn) {
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    return notesOn.forEach((function(_this) {
      return function(note) {
        return state[instrument._id].notes[note.key] = {
          time: time,
          i: i,
          len: note.length / bps
        };
      };
    })(this));
  };

  return DrumSynthesizer;

})(Instrument);



},{"../dsp/highpass_filter":3,"../dsp/oscillators":6,"../dsp/simple_envelope":7,"../util/log_sample":19,"./instrument":12,"cuid":21}],12:[function(require,module,exports){
var Instrument, Model, RingBuffer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Model = require('./model');

RingBuffer = require('../util/ring_buffer');

module.exports = Instrument = (function(_super) {
  __extends(Instrument, _super);

  function Instrument() {
    return Instrument.__super__.constructor.apply(this, arguments);
  }

  Instrument.createState = function(state, instrument) {
    return state[instrument._id] = {
      notes: new RingBuffer(instrument.maxPolyphony, Array, instrument.polyphony)
    };
  };

  Instrument.releaseState = function(state, instrument) {
    return delete state[instrument._id];
  };

  Instrument.sample = function(state, instrument, time, i) {
    return 0;
  };

  Instrument.tick = function(state, instrument, time, i, beat, bps, notesOn) {
    var instrumentState;
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    instrumentState = state[instrument._id];
    if (instrument.polyphony !== instrumentState.notes.length) {
      instrumentState.notes.resize(instrument.polyphony);
    }
    return notesOn.forEach((function(_this) {
      return function(note) {
        return instrumentState.notes.push({
          time: time,
          i: i,
          key: note.key,
          len: note.length / bps
        });
      };
    })(this));
  };

  return Instrument;

})(Model);



},{"../util/ring_buffer":20,"./model":14}],13:[function(require,module,exports){
var Instrument, LoopSampler, RingBuffer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('../util/ring_buffer');

module.exports = LoopSampler = (function(_super) {
  __extends(LoopSampler, _super);

  function LoopSampler() {
    return LoopSampler.__super__.constructor.apply(this, arguments);
  }

  LoopSampler.prototype.defaults = {
    level: 0.5,
    polyphony: 1,
    slices: []
  };

  return LoopSampler;

})(Instrument);



},{"../util/ring_buffer":20,"./instrument":12}],14:[function(require,module,exports){
var Model, cuid, deepMerge;

deepMerge = require('../util/deep_merge');

cuid = require('cuid');

module.exports = Model = (function() {
  function Model() {}

  Model.defaults = {};

  Model.build = function(data) {
    var defaults;
    if (data == null) {
      data = {};
    }
    if (data._id == null) {
      data._id = cuid();
    }
    defaults = typeof this.defaults === 'function' ? this.defaults() : this.defaults;
    return deepMerge(defaults, data);
  };

  return Model;

})();



},{"../util/deep_merge":18,"cuid":21}],15:[function(require,module,exports){
var Model, Sequence,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Model = require('./model');

module.exports = Sequence = (function(_super) {
  __extends(Sequence, _super);

  function Sequence() {
    return Sequence.__super__.constructor.apply(this, arguments);
  }

  Sequence.defaults = {
    loopSize: 4,
    notes: {}
  };

  Sequence.notesOn = function(sequence, beat, lastBeat) {
    var bar, id, lastBar, note, result, _ref;
    bar = Math.floor(beat / sequence.loopSize);
    lastBar = Math.floor(lastBeat / sequence.loopSize);
    beat = beat % sequence.loopSize;
    lastBeat = lastBeat % sequence.loopSize;
    result = [];
    _ref = sequence.notes;
    for (id in _ref) {
      note = _ref[id];
      if (note.start < beat && (note.start >= lastBeat || bar > lastBar)) {
        result.push(note);
      }
    }
    return result;
  };

  return Sequence;

})(Model);



},{"./model":14}],16:[function(require,module,exports){
var Song, Track,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Track = require('./track');

module.exports = Song = (function() {
  var clip, clockRatio, meterDecay;

  clockRatio = 500;

  meterDecay = 0.05;

  clip = function(sample) {
    return Math.max(0, Math.min(2, sample + 1)) - 1;
  };

  function Song() {
    this.tick = __bind(this.tick, this);
    this.sample = __bind(this.sample, this);
    this.lastBeat = 0;
    this.state = {};
    this.data = null;
  }

  Song.prototype.update = function(data) {
    return this.data = data;
  };

  Song.prototype.buffer = function(size, index, sampleRate, cb) {
    var arr, i, ii, t, _i;
    arr = new Float32Array(size);
    if (this.data != null) {
      for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
        ii = i + index;
        t = ii / sampleRate;
        arr[i] = this.sample(t, ii);
      }
    }
    return cb(arr.buffer);
  };

  Song.prototype.sample = function(time, i) {
    if (i % clockRatio === 0) {
      this.tick(time, i);
    }
    return clip(this.data.tracks.reduce((function(_this) {
      return function(memo, track) {
        return memo + Track.sample(_this.state, track, time, i);
      };
    })(this), 0));
  };

  Song.prototype.tick = function(time, i) {
    var beat, bps;
    bps = this.data.bpm / 60;
    beat = time * bps;
    this.data.tracks.forEach((function(_this) {
      return function(track) {
        return Track.tick(_this.state, track, time, i, beat, _this.lastBeat, bps);
      };
    })(this));
    return this.lastBeat = beat;
  };

  Song.prototype.processFrame = function() {
    var track, _i, _len, _ref, _results;
    if (this.data != null) {
      _ref = this.data.tracks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        if (this.state[track._id] != null) {
          _results.push(this.state[track._id].meterLevel -= meterDecay);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Song.prototype.getState = function() {
    return {
      meterLevels: this.data.tracks.reduce((function(_this) {
        return function(memo, track) {
          var _ref;
          memo[track._id] = (_ref = _this.state[track._id]) != null ? _ref.meterLevel : void 0;
          return memo;
        };
      })(this), {})
    };
  };

  return Song;

})();



},{"./track":17}],17:[function(require,module,exports){
var Model, Sequence, Track, instrumentTypes, logSample,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Model = require('./model');

Sequence = require('./sequence');

logSample = require('../util/log_sample');

instrumentTypes = {
  AnalogSynthesizer: require('./analog_synthesizer'),
  BasicSampler: require('./basic_sampler'),
  DrumSampler: require('./drum_sampler'),
  DrumSynthesizer: require('./drum_synthesizer'),
  LoopSampler: require('./loop_sampler')
};

module.exports = Track = (function(_super) {
  __extends(Track, _super);

  function Track() {
    return Track.__super__.constructor.apply(this, arguments);
  }

  Track.defaults = function() {
    return {
      name: 'Track',
      sequence: Sequence.build(),
      effects: []
    };
  };

  Track.createState = function(state, track) {
    return state[track._id] = {
      meterLevel: 0
    };
  };

  Track.releaseState = function(state, track) {
    return delete state[track._id];
  };

  Track.sample = function(state, track, time, i) {
    var Instrument, level, sample, trackState;
    Instrument = instrumentTypes[track.instrument._type];
    sample = Instrument.sample(state, track.instrument, time, i);
    sample = track.effects.reduce(function(sample, effect) {
      return Effect.sample(state, effect, time, i, sample);
    }, sample);
    if (trackState = state[track._id]) {
      level = trackState.meterLevel;
      if ((level == null) || isNaN(level) || sample > level) {
        trackState.meterLevel = sample;
      }
    }
    return sample;
  };

  Track.tick = function(state, track, time, i, beat, lastBeat, bps) {
    var Instrument, notesOn;
    if (state[track._id] == null) {
      this.createState(state, track);
    }
    Instrument = instrumentTypes[track.instrument._type];
    notesOn = Sequence.notesOn(track.sequence, beat, lastBeat);
    Instrument.tick(state, track.instrument, time, i, beat, bps, notesOn);
    return track.effects.forEach(function(e) {
      return e.tick(state, time, beat, bps);
    });
  };

  return Track;

})(Model);



},{"../util/log_sample":19,"./analog_synthesizer":8,"./basic_sampler":9,"./drum_sampler":10,"./drum_synthesizer":11,"./loop_sampler":13,"./model":14,"./sequence":15}],18:[function(require,module,exports){
var deepMerge, isObject;

isObject = function(o) {
  return (o != null) && toString.call(o) === '[object Object]';
};

module.exports = deepMerge = function(src, data) {
  var dst, key;
  dst = Array.isArray(src) ? [] : {};
  for (key in src) {
    dst[key] = src[key];
  }
  for (key in data) {
    if (isObject(data[key]) && isObject(src[key])) {
      dst[key] = deepMerge(src[key], data[key]);
    } else {
      dst[key] = data[key];
    }
  }
  return dst;
};



},{}],19:[function(require,module,exports){
var i;

i = 0;

module.exports = function(v) {
  if (i === 0) {
    console.log(v);
  }
  return i = (i + 1) % 7000;
};



},{}],20:[function(require,module,exports){
var RingBuffer;

module.exports = RingBuffer = (function() {
  function RingBuffer(maxLength, Type, length) {
    this.maxLength = maxLength;
    this.Type = Type != null ? Type : Float32Array;
    this.length = length;
    this.length || (this.length = this.maxLength);
    this.array = new Type(this.maxLength);
    this.pos = 0;
  }

  RingBuffer.prototype.reset = function() {
    this.array = new this.Type(this.maxLength);
    return this;
  };

  RingBuffer.prototype.resize = function(length) {
    this.length = length;
    if (this.pos >= this.length) {
      return this.pos = 0;
    }
  };

  RingBuffer.prototype.push = function(el) {
    this.array[this.pos] = el;
    this.pos += 1;
    if (this.pos === this.length) {
      this.pos = 0;
    }
    return this;
  };

  RingBuffer.prototype.forEach = function(fn) {
    var i, len;
    for (i = this.pos, len = this.length; i < len; i++) {
      fn(this.array[i], i);
    }
    for (i = 0, len = this.pos; i < len; i++) {
      fn(this.array[i], i);
    };
    return this;
  };

  RingBuffer.prototype.reduce = function(fn, memo) {
    if (memo == null) {
      memo = 0;
    }
    this.forEach(function(el, i) {
      return memo = fn(memo, el, i);
    });
    return memo;
  };

  return RingBuffer;

})();



},{}],21:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 * 
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

/*global window, navigator, document, require, process, module */
(function (app) {
  'use strict';
  var namespace = 'cuid',
    c = 0,
    blockSize = 4,
    base = 36,
    discreteValues = Math.pow(base, blockSize),

    pad = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length-size);
    },

    randomBlock = function randomBlock() {
      return pad((Math.random() *
            discreteValues << 0)
            .toString(base), blockSize);
    },

    safeCounter = function () {
      c = (c < discreteValues) ? c : 0;
      c++; // this is not subliminal
      return c - 1;
    },

    api = function cuid() {
      // Starting with a lowercase letter makes
      // it HTML element ID friendly.
      var letter = 'c', // hard-coded allows for sequential access

        // timestamp
        // warning: this exposes the exact date and time
        // that the uid was created.
        timestamp = (new Date().getTime()).toString(base),

        // Prevent same-machine collisions.
        counter,

        // A few chars to generate distinct ids for different
        // clients (so different computers are far less
        // likely to generate the same id)
        fingerprint = api.fingerprint(),

        // Grab some more chars from Math.random()
        random = randomBlock() + randomBlock();

        counter = pad(safeCounter().toString(base), blockSize);

      return  (letter + timestamp + counter + fingerprint + random);
    };

  api.slug = function slug() {
    var date = new Date().getTime().toString(36),
      counter,
      print = api.fingerprint().slice(0,1) +
        api.fingerprint().slice(-1),
      random = randomBlock().slice(-2);

      counter = safeCounter().toString(36).slice(-4);

    return date.slice(-2) + 
      counter + print + random;
  };

  api.globalCount = function globalCount() {
    // We want to cache the results of this
    var cache = (function calc() {
        var i,
          count = 0;

        for (i in window) {
          count++;
        }

        return count;
      }());

    api.globalCount = function () { return cache; };
    return cache;
  };

  api.fingerprint = function browserPrint() {
    return pad((navigator.mimeTypes.length +
      navigator.userAgent.length).toString(36) +
      api.globalCount().toString(36), 4);
  };

  // don't change anything from here down.
  if (app.register) {
    app.register(namespace, api);
  } else if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    app[namespace] = api;
  }

}(this.applitude || this));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2VudmVsb3BlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2xpbmVhcl9pbnRlcnBvbGF0b3IuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2xvd3Bhc3NfZmlsdGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9vc2NpbGxhdG9ycy5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3Avc2ltcGxlX2VudmVsb3BlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL21vZGVscy9hbmFsb2dfc3ludGhlc2l6ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvbW9kZWxzL2Jhc2ljX3NhbXBsZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvbW9kZWxzL2RydW1fc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9tb2RlbHMvZHJ1bV9zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9tb2RlbHMvaW5zdHJ1bWVudC5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9tb2RlbHMvbG9vcF9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL21vZGVscy9tb2RlbC5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9tb2RlbHMvc2VxdWVuY2UuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvbW9kZWxzL3NvbmcuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvbW9kZWxzL3RyYWNrLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL3V0aWwvZGVlcF9tZXJnZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy91dGlsL2xvZ19zYW1wbGUuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvdXRpbC9yaW5nX2J1ZmZlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9ub2RlX21vZHVsZXMvY3VpZC9kaXN0L2Jyb3dzZXItY3VpZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsVUFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLHNCQUFSLENBQVAsQ0FB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJTb25nID0gcmVxdWlyZSAnLi9tb2RlbHMvc29uZy5jb2ZmZWUnXG5cbnNvbmcgPSBuZXcgU29uZ1xuXG5jb25zb2xlLmxvZyAnaW4gd29ya2VyIHNjcmlwdCdcblxuc2VsZi5vbm1lc3NhZ2UgPSAoZSkgLT5cblxuICBzd2l0Y2ggZS5kYXRhLnR5cGVcbiAgICB3aGVuICd1cGRhdGUnXG4gICAgICBzb25nLnVwZGF0ZSBlLmRhdGEuc3RhdGVcbiAgICB3aGVuICdidWZmZXInXG4gICAgICBzb25nLmJ1ZmZlciBlLmRhdGEuc2l6ZSwgZS5kYXRhLmluZGV4LCBlLmRhdGEuc2FtcGxlUmF0ZSwgKGJ1ZmZlcikgLT5cbiAgICAgICAgcG9zdE1lc3NhZ2VcbiAgICAgICAgICB0eXBlOiAnYnVmZmVyJ1xuICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyXG4gICAgICAgICwgW2J1ZmZlcl1cblxuc2V0SW50ZXJ2YWwgLT5cbiAgc29uZy5wcm9jZXNzRnJhbWUoKVxuICBwb3N0TWVzc2FnZVxuICAgIHR5cGU6ICdmcmFtZSdcbiAgICBmcmFtZTogc29uZy5nZXRTdGF0ZSgpXG5cbiwgMTAwMCAvIDYwXG4iLCJtaW5FbnZWYWx1ZSA9IDAuMDFcblxubW9kdWxlLmV4cG9ydHMgPSAoZW52LCBub3RlLCB0aW1lKSAtPlxuXG4gIGVsYXBzZWQgPSB0aW1lIC0gbm90ZS50aW1lXG4gIGEgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmFcbiAgZCA9IE1hdGgubWF4IG1pbkVudlZhbHVlLCBlbnYuZFxuICBzID0gZW52LnNcbiAgciA9IE1hdGgubWF4IG1pbkVudlZhbHVlLCBlbnYuclxuXG4gICMgYXR0YWNrLCBkZWNheSwgc3VzdGFpblxuICBsID0gaWYgZWxhcHNlZCA+IGEgKyBkXG4gICAgbCA9IHNcbiAgZWxzZSBpZiBlbGFwc2VkID4gYVxuICAgIGwgPSBzICsgKDEgLSBzKSAqIChhICsgZCAtIGVsYXBzZWQpIC8gZFxuICBlbHNlXG4gICAgZWxhcHNlZCAvIGFcblxuICAjIHJlbGVhc2VcbiAgaWYgZWxhcHNlZCA+IG5vdGUubGVuXG4gICAgbCA9IGwgKiAociArIG5vdGUubGVuIC0gZWxhcHNlZCkgLyByXG5cbiAgTWF0aC5tYXggMCwgbFxuIiwic2FtcGxlUmF0ZSA9IDQ4MDAwXG5tYXhGcmVxID0gMTIwMDBcbmRiR2FpbiA9IDEyICAgICMgZ2FpbiBvZiBmaWx0ZXJcbmJhbmR3aWR0aCA9IDEgICMgYmFuZHdpZHRoIGluIG9jdGF2ZXNcblxuIyBjb25zdGFudHNcbkEgPSBNYXRoLnBvdygxMCwgZGJHYWluIC8gNDApXG5lID0gTWF0aC5sb2coMilcbnRhdSA9IDIgKiBNYXRoLlBJXG5iZXRhID0gTWF0aC5zcXJ0KDIgKiBBKVxuXG4jIGh5cGVyYm9saWMgc2luIGZ1bmN0aW9uXG5zaW5oID0gKHgpIC0+XG4gIHkgPSBNYXRoLmV4cCB4XG4gICh5IC0gMSAvIHkpIC8gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGEwID0gYTEgPSBhMiA9IGEzID0gYTQgPSB4MSA9IHgyID0geTEgPSB5MiA9IDBcbiAgZnJlcSA9IG9tZWdhID0gc24gPSBhbHBoYSA9IDBcbiAgY3MgPSAxXG5cbiAgbGFzdEN1dG9mZiA9IDBcblxuICAoc2FtcGxlLCBjdXRvZmYpIC0+XG4gICAgIyBjYWNoZSBmaWx0ZXIgdmFsdWVzIHVudGlsIGN1dG9mZiBjaGFuZ2VzXG4gICAgaWYgY3V0b2ZmICE9IGxhc3RDdXRvZmZcbiAgXG4gICAgICBvbGRDdXRvZmYgPSBjdXRvZmZcblxuICAgICAgZnJlcSA9IGN1dG9mZiAqIG1heEZyZXFcbiAgICAgIG9tZWdhID0gdGF1ICogZnJlcSAvIHNhbXBsZVJhdGVcbiAgICAgIHNuID0gTWF0aC5zaW4gb21lZ2FcbiAgICAgIGNzID0gTWF0aC5jb3Mgb21lZ2FcbiAgICAgIGFscGhhID0gc24gKiBzaW5oKGUgLyAyICogYmFuZHdpZHRoICogb21lZ2EgLyBzbilcblxuICAgICAgYjAgPSAoMSArIGNzKSAvIDJcbiAgICAgIGIxID0gLSgxICsgY3MpXG4gICAgICBiMiA9ICgxICsgY3MpIC8gMlxuICAgICAgYWEwID0gMSArIGFscGhhXG4gICAgICBhYTEgPSAtMiAqIGNzXG4gICAgICBhYTIgPSAxIC0gYWxwaGFcblxuICAgICAgYTAgPSBiMCAvIGFhMFxuICAgICAgYTEgPSBiMSAvIGFhMFxuICAgICAgYTIgPSBiMiAvIGFhMFxuICAgICAgYTMgPSBhYTEgLyBhYTBcbiAgICAgIGE0ID0gYWEyIC8gYWEwXG5cbiAgICAjIGNvbXB1dGUgcmVzdWx0XG4gICAgcyA9IE1hdGgubWF4IC0xLCBNYXRoLm1pbiAxLCBzYW1wbGVcbiAgICByZXN1bHQgPSBhMCAqIHMgKyBhMSAqIHgxICsgYTIgKiB4MiAtIGEzICogeTEgLSBhNCAqIHkyXG5cbiAgICAjIHNoaWZ0IHgxIHRvIHgyLCBzYW1wbGUgdG8geDFcbiAgICB4MiA9IHgxXG4gICAgeDEgPSBzXG5cbiAgICAjIHNoaWZ0IHkxIHRvIHkyLCByZXN1bHQgdG8geTFcbiAgICB5MiA9IHkxXG4gICAgeTEgPSByZXN1bHRcblxuICAgIHJlc3VsdCIsIm1vZHVsZS5leHBvcnRzID0gKHNhbXBsZURhdGEsIHRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldCA9IDAsIGxvb3BBY3RpdmUgPSBmYWxzZSwgbG9vcFBvaW50KSAtPlxuICBpID0gc2FtcGxlc0VsYXBzZWQgKiBNYXRoLnBvdyAyLCB0cmFuc3Bvc2UgLyAxMlxuICBpMSA9IE1hdGguZmxvb3IgaVxuICBpMSA9IGkxICUgKGxvb3BQb2ludCAtIG9mZnNldCkgaWYgbG9vcEFjdGl2ZVxuICBpMiA9IGkxICsgMVxuICBsID0gaSAlIDFcblxuICBzYW1wbGVEYXRhW29mZnNldCArIGkxXSAqICgxIC0gbCkgKyBzYW1wbGVEYXRhW29mZnNldCArIGkyXSAqIGwiLCJzYW1wbGVSYXRlID0gNDgwMDBcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuXG4gIHkxID0geTIgPSB5MyA9IHk0ID0gb2xkeCA9IG9sZHkxID0gb2xkeTIgPSBvbGR5MyA9IDBcbiAgcCA9IGsgPSB0MSA9IHQyID0gciA9IHggPSBudWxsXG5cbiAgKHNhbXBsZSwgY3V0b2ZmLCByZXMpIC0+XG4gICAgZnJlcSA9IDIwICogTWF0aC5wb3cgMTAsIDMgKiBjdXRvZmZcbiAgICBmcmVxID0gZnJlcSAvIHNhbXBsZVJhdGVcbiAgICBwID0gZnJlcSAqICgxLjggLSAoMC44ICogZnJlcSkpXG4gICAgayA9IDIgKiBNYXRoLnNpbihmcmVxICogTWF0aC5QSSAvIDIpIC0gMVxuICAgIHQxID0gKDEgLSBwKSAqIDEuMzg2MjQ5XG4gICAgdDIgPSAxMiArIHQxICogdDFcbiAgICByID0gcmVzICogMC41NyAqICh0MiArIDYgKiB0MSkgLyAodDIgLSA2ICogdDEpXG5cbiAgICB4ID0gc2FtcGxlIC0gciAqIHk0XG5cbiAgICAjIGZvdXIgY2FzY2FkZWQgb25lLXBvbGUgZmlsdGVycyAoYmlsaW5lYXIgdHJhbnNmb3JtKVxuICAgIHkxID0gIHggKiBwICsgb2xkeCAgKiBwIC0gayAqIHkxXG4gICAgeTIgPSB5MSAqIHAgKyBvbGR5MSAqIHAgLSBrICogeTJcbiAgICB5MyA9IHkyICogcCArIG9sZHkyICogcCAtIGsgKiB5M1xuICAgIHk0ID0geTMgKiBwICsgb2xkeTMgKiBwIC0gayAqIHk0XG5cbiAgICAjIGNsaXBwZXIgYmFuZCBsaW1pdGVkIHNpZ21vaWRcbiAgICB5NCAtPSAoeTQgKiB5NCAqIHk0KSAvIDZcblxuICAgIG9sZHggPSB4XG4gICAgb2xkeTEgPSB5MVxuICAgIG9sZHkyID0geTJcbiAgICBvbGR5MyA9IHkzXG5cbiAgICB5NCIsInRhdSA9IE1hdGguUEkgKiAyXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBzaW5lOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIE1hdGguc2luIHRpbWUgKiB0YXUgKiBmcmVxdWVuY3lcblxuICBzcXVhcmU6ICh0aW1lLCBmcmVxdWVuY3kpIC0+XG4gICAgaWYgKCh0aW1lICUgKDEgLyBmcmVxdWVuY3kpKSAqIGZyZXF1ZW5jeSkgJSAxID4gMC41IHRoZW4gMSBlbHNlIC0xXG5cbiAgc2F3OiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIDEgLSAyICogKCgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSlcblxuICBub2lzZTogLT5cbiAgICAyICogTWF0aC5yYW5kb20oKSAtIDEiLCJtb2R1bGUuZXhwb3J0cyA9IChkZWNheSwgZWxhcHNlZCkgLT5cbiAgaWYgZWxhcHNlZCA+IGRlY2F5XG4gICAgMFxuICBlbHNlXG4gICAgMSAtIGVsYXBzZWQgLyBkZWNheVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuLi91dGlsL3JpbmdfYnVmZmVyJ1xubG93cGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4uL2RzcC9sb3dwYXNzX2ZpbHRlcidcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi4vZHNwL2hpZ2hwYXNzX2ZpbHRlcidcbmVudmVsb3BlID0gcmVxdWlyZSAnLi4vZHNwL2VudmVsb3BlJ1xub3NjaWxsYXRvcnMgPSByZXF1aXJlICcuLi9kc3Avb3NjaWxsYXRvcnMnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQW5hbG9nU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgQGRlZmF1bHRzOlxuICAgIF90eXBlOiAnQW5hbG9nU3ludGhlc2l6ZXInXG4gICAgbGV2ZWw6IDAuNVxuICAgIHBhbjogMC41XG4gICAgcG9seXBob255OiAzXG4gICAgbWF4UG9seXBob255OiA2XG4gICAgdm9sdW1lRW52OlxuICAgICAgYTogMFxuICAgICAgZDogMC4yNVxuICAgICAgczogMFxuICAgICAgcjogMC41XG4gICAgZmlsdGVyRW52OlxuICAgICAgYTogMFxuICAgICAgZDogMC4yNVxuICAgICAgczogMC4yXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXI6XG4gICAgICB0eXBlOiAnTFAnXG4gICAgICBmcmVxOiAwLjI3XG4gICAgICByZXM6IDAuMDVcbiAgICAgIGVudjogMC40NVxuICAgIG9zYzE6XG4gICAgICB3YXZlZm9ybTogJ3NhdydcbiAgICAgIGxldmVsOiAwLjVcbiAgICAgIHBpdGNoOiAwLjVcbiAgICAgIHR1bmU6IDAuNVxuICAgIG9zYzI6XG4gICAgICB3YXZlZm9ybTogJ3NhdydcbiAgICAgIGxldmVsOiAwLjVcbiAgICAgIHBpdGNoOiAwLjVcbiAgICAgIHR1bmU6IDAuNVxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN1cGVyIHN0YXRlLCBpbnN0cnVtZW50XG5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVycyA9XG4gICAgICBMUDogKGxvd3Bhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIEhQOiAoaGlnaHBhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIG5vbmU6ICgoKHNhbXBsZSkgLT4gc2FtcGxlKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcblxuICB0dW5lID0gNDQwXG4gIGZyZXF1ZW5jeSA9IChrZXkpIC0+XG4gICAgdHVuZSAqIE1hdGgucG93IDIsIChrZXkgLSA2OSkgLyAxMlxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIHIgPSBNYXRoLm1heCAwLjAxLCBpbnN0cnVtZW50LnZvbHVtZUVudi5yXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlcy5yZWR1Y2UoKG1lbW8sIG5vdGUsIGluZGV4KSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZS5sZW4gKyByID4gdGltZSAtIG5vdGUudGltZVxuXG4gICAgICAjIHN1bSBvc2NpbGxhdG9ycyBhbmQgYXBwbHkgdm9sdW1lIGVudmVsb3BlXG4gICAgICBvc2MxRnJlcSA9IGZyZXF1ZW5jeSBub3RlLmtleSArIGluc3RydW1lbnQub3NjMS50dW5lIC0gMC41ICsgTWF0aC5yb3VuZCgyNCAqIChpbnN0cnVtZW50Lm9zYzEucGl0Y2ggLSAwLjUpKVxuICAgICAgb3NjMkZyZXEgPSBmcmVxdWVuY3kgbm90ZS5rZXkgKyBpbnN0cnVtZW50Lm9zYzIudHVuZSAtIDAuNSArIE1hdGgucm91bmQoMjQgKiAoaW5zdHJ1bWVudC5vc2MyLnBpdGNoIC0gMC41KSlcbiAgICAgIHNhbXBsZSA9IGVudmVsb3BlKGluc3RydW1lbnQudm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChcbiAgICAgICAgaW5zdHJ1bWVudC5vc2MxLmxldmVsICogb3NjaWxsYXRvcnNbaW5zdHJ1bWVudC5vc2MxLndhdmVmb3JtXSh0aW1lLCBvc2MxRnJlcSkgK1xuICAgICAgICBpbnN0cnVtZW50Lm9zYzIubGV2ZWwgKiBvc2NpbGxhdG9yc1tpbnN0cnVtZW50Lm9zYzIud2F2ZWZvcm1dKHRpbWUsIG9zYzJGcmVxKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGZpbHRlciB3aXRoIGVudmVsb3BlXG4gICAgICBjdXRvZmYgPSBNYXRoLm1pbiAxLCBpbnN0cnVtZW50LmZpbHRlci5mcmVxICsgaW5zdHJ1bWVudC5maWx0ZXIuZW52ICogZW52ZWxvcGUoaW5zdHJ1bWVudC5maWx0ZXJFbnYsIG5vdGUsIHRpbWUpXG4gICAgICBmaWx0ZXIgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tpbnN0cnVtZW50LmZpbHRlci50eXBlXVtpbmRleF1cbiAgICAgIHNhbXBsZSA9IGZpbHRlciBzYW1wbGUsIGN1dG9mZiwgaW5zdHJ1bWVudC5maWx0ZXIucmVzXG5cbiAgICAgICMgcmV0dXJuIHJlc3VsdFxuICAgICAgbWVtbyArIHNhbXBsZVxuXG4gICAgLCAwKVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuLi91dGlsL3JpbmdfYnVmZmVyJ1xubGluZWFySW50ZXJwb2xhdG9yID0gcmVxdWlyZSAnLi4vZHNwL2xpbmVhcl9pbnRlcnBvbGF0b3InXG5sb3dwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi4vZHNwL2xvd3Bhc3NfZmlsdGVyJ1xuaGlnaHBhc3NGaWx0ZXIgPSByZXF1aXJlICcuLi9kc3AvaGlnaHBhc3NfZmlsdGVyJ1xuZW52ZWxvcGUgPSByZXF1aXJlICcuLi9kc3AvZW52ZWxvcGUnXG5sb2dTYW1wbGUgPSByZXF1aXJlICcuLi91dGlsL2xvZ19zYW1wbGUnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQmFzaWNTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIEBkZWZhdWx0czpcbiAgICBfdHlwZTogJ0Jhc2ljU2FtcGxlcidcbiAgICBsZXZlbDogMC41XG4gICAgcGFuOiAwLjVcbiAgICBwb2x5cGhvbnk6IDFcbiAgICBtYXhQb2x5cGhvbnk6IDZcbiAgICByb290S2V5OiA2MFxuICAgIHNhbXBsZURhdGE6IG51bGxcbiAgICBzYW1wbGVOYW1lOiAnJ1xuICAgIHN0YXJ0OiAwLjNcbiAgICBsb29wQWN0aXZlOiAnbG9vcCdcbiAgICBsb29wOiAwLjdcbiAgICB0dW5lOiAwLjVcbiAgICB2b2x1bWVFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXJFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXI6XG4gICAgICB0eXBlOiAnbm9uZSdcbiAgICAgIGZyZXE6IDAuMjdcbiAgICAgIHJlczogMC4wNVxuICAgICAgZW52OiAwLjQ1XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3VwZXIgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG4gICAgcmV0dXJuIDAgdW5sZXNzIGluc3RydW1lbnQuc2FtcGxlRGF0YT9cblxuICAgIHIgPSBNYXRoLm1heCAwLjAxLCBpbnN0cnVtZW50LnZvbHVtZUVudi5yXG5cbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlLmxlbiArIHIgPiB0aW1lIC0gbm90ZS50aW1lXG5cbiAgICAgICMgZ2V0IHBpdGNoIHNoaWZ0ZWQgaW50ZXJwb2xhdGVkIHNhbXBsZSBhbmQgYXBwbHkgdm9sdW1lIGVudmVsb3BlXG4gICAgICB0cmFuc3Bvc2UgPSBub3RlLmtleSAtIGluc3RydW1lbnQucm9vdEtleSArIGluc3RydW1lbnQudHVuZSAtIDAuNVxuICAgICAgc2FtcGxlc0VsYXBzZWQgPSBpIC0gbm90ZS5pXG4gICAgICBvZmZzZXQgPSBNYXRoLmZsb29yIGluc3RydW1lbnQuc3RhcnQgKiBpbnN0cnVtZW50LnNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBsb29wUG9pbnQgPSBNYXRoLmZsb29yIGluc3RydW1lbnQubG9vcCAqIGluc3RydW1lbnQuc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIHNhbXBsZSA9IGxpbmVhckludGVycG9sYXRvciBpbnN0cnVtZW50LnNhbXBsZURhdGEsIHRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldCwgaW5zdHJ1bWVudC5sb29wQWN0aXZlID09ICdsb29wJywgbG9vcFBvaW50XG4gICAgICBzYW1wbGUgPSBlbnZlbG9wZShpbnN0cnVtZW50LnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuZW52ZWxvcGUgPSByZXF1aXJlICcuLi9kc3AvZW52ZWxvcGUnXG5saW5lYXJJbnRlcnBvbGF0b3IgPSByZXF1aXJlICcuLi9kc3AvbGluZWFyX2ludGVycG9sYXRvcidcbmxvZ1NhbXBsZSA9IHJlcXVpcmUgJy4uL3V0aWwvbG9nX3NhbXBsZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcnVtU2FtcGxlciBleHRlbmRzIEluc3RydW1lbnRcblxuICBAZGVmYXVsdHM6XG4gICAgX3R5cGU6ICdEcnVtU2FtcGxlcidcbiAgICBsZXZlbDogMC41XG4gICAgcGFuOiAwLjVcbiAgICBkcnVtczogW1xuICAgICAge1xuICAgICAgICBuYW1lOiAnRHJ1bSAxJ1xuICAgICAgICBzYW1wbGVEYXRhOiBudWxsXG4gICAgICAgIHNhbXBsZU5hbWU6ICcnXG4gICAgICAgIHRyYW5zcG9zZTogMFxuICAgICAgICBsZXZlbDogMVxuICAgICAgICBzdGFydDogMFxuICAgICAgICBrZXk6IDBcbiAgICAgICAgdm9sdW1lRW52OlxuICAgICAgICAgIGE6IDBcbiAgICAgICAgICBkOiAxXG4gICAgICAgICAgczogMVxuICAgICAgICAgIHI6IDFcbiAgICAgIH1cbiAgICBdXG5cbiAgQGRlZmF1bHREcnVtOiAoZHJ1bXMpIC0+XG4gICAgbmFtZTogXCJEcnVtICN7ZHJ1bXMubGVuZ3RoICsgMX1cIlxuICAgIHNhbXBsZURhdGE6IG51bGxcbiAgICBzYW1wbGVOYW1lOiAnJ1xuICAgIHRyYW5zcG9zZTogMFxuICAgIGxldmVsOiAxXG4gICAgc3RhcnQ6IDBcbiAgICBrZXk6IGRvID0+XG4gICAgICBrZXkgPSAwXG4gICAgICBrZXkgKz0gMSB3aGlsZSBkcnVtcy5zb21lIChkcnVtKSAtPiBkcnVtLmtleSA9PSBrZXlcbiAgICAgIGtleVxuICAgIHZvbHVtZUVudjpcbiAgICAgIGE6IDBcbiAgICAgIGQ6IDFcbiAgICAgIHM6IDFcbiAgICAgIHI6IDFcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgdG8gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bVxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPSBub3Rlczoge31cblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgICMgc3VtIGFsbCBhY3RpdmUgbm90ZXNcbiAgICBpbnN0cnVtZW50LmxldmVsICogaW5zdHJ1bWVudC5kcnVtcy5yZWR1Y2UoKG1lbW8sIGRydW0pID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3MgZHJ1bS5zYW1wbGVEYXRhP1xuXG4gICAgICBub3RlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW2RydW0ua2V5XVxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG5cbiAgICAgIHNhbXBsZXNFbGFwc2VkID0gaSAtIG5vdGUuaVxuICAgICAgb2Zmc2V0ID0gTWF0aC5mbG9vciBkcnVtLnN0YXJ0ICogZHJ1bS5zYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgcmV0dXJuIG1lbW8gaWYgc2FtcGxlc0VsYXBzZWQgKyBvZmZzZXQgPiBkcnVtLnNhbXBsZURhdGEubGVuZ3RoXG5cbiAgICAgIHNhbXBsZSA9IGxpbmVhckludGVycG9sYXRvciBkcnVtLnNhbXBsZURhdGEsIGRydW0udHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0XG4gICAgICBtZW1vICsgZHJ1bS5sZXZlbCAqIGVudmVsb3BlKGRydW0udm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChzYW1wbGUgb3IgMClcbiAgICAsIDApXG5cbiAgQHRpY2s6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSwgYmVhdCwgYnBzLCBub3Rlc09uKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgbm90ZXNPbi5mb3JFYWNoIChub3RlKSA9PlxuICAgICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW25vdGUua2V5XSA9IHt0aW1lLCBpLCBsZW46IG5vdGUubGVuZ3RoIC8gYnBzfVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi4vZHNwL2hpZ2hwYXNzX2ZpbHRlcidcbnNpbXBsZUVudmVsb3BlID0gcmVxdWlyZSAnLi4vZHNwL3NpbXBsZV9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi4vZHNwL29zY2lsbGF0b3JzJ1xubG9nU2FtcGxlID0gcmVxdWlyZSAnLi4vdXRpbC9sb2dfc2FtcGxlJ1xuY3VpZCA9IHJlcXVpcmUgJ2N1aWQnXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcnVtU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgbWluRnJlcSA9IDYwXG4gIG1heEZyZXEgPSAzMDAwXG4gIGZyZXFTY2FsZSA9IG1heEZyZXEgLSBtaW5GcmVxXG5cbiAgQGRlZmF1bHRzOlxuICAgIF90eXBlOiAnRHJ1bVN5bnRoZXNpemVyJ1xuICAgIGxldmVsOiAwLjVcbiAgICBwYW46IDAuNVxuICAgIGRydW1zOiBbXG4gICAgICB7XG4gICAgICAgIGtleTogMFxuICAgICAgICBuYW1lOiAnS2ljaydcbiAgICAgICAgbGV2ZWw6IDFcbiAgICAgICAgaHA6IDBcbiAgICAgICAgZGVjYXk6IDAuMzVcbiAgICAgICAgbm9pc2U6IDAuMDAxXG4gICAgICAgIHBpdGNoOiAwXG4gICAgICAgIGJlbmQ6IDAuMzlcbiAgICAgICAgZm06IDFcbiAgICAgICAgZm1EZWNheTogMC4wNVxuICAgICAgICBmbUZyZXE6IDAuMDJcbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAxXG4gICAgICAgIG5hbWU6ICdTbmFyZSdcbiAgICAgICAgbGV2ZWw6IDAuNVxuICAgICAgICBocDogMC4yMlxuICAgICAgICBkZWNheTogMC4xXG4gICAgICAgIG5vaXNlOiAwLjhcbiAgICAgICAgcGl0Y2g6IDAuMVxuICAgICAgICBiZW5kOiAwXG4gICAgICAgIGZtOiAwXG4gICAgICAgIGZtRGVjYXk6IDBcbiAgICAgICAgZm1GcmVxOiAwXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogMlxuICAgICAgICBuYW1lOiAnSEgxJ1xuICAgICAgICBsZXZlbDogMC4wNVxuICAgICAgICBocDogMVxuICAgICAgICBkZWNheTogMC4wN1xuICAgICAgICBub2lzZTogMC44XG4gICAgICAgIHBpdGNoOiAwLjRcbiAgICAgICAgYmVuZDogMFxuICAgICAgICBmbTogMVxuICAgICAgICBmbURlY2F5OiAwLjRcbiAgICAgICAgZm1GcmVxOiAwXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogM1xuICAgICAgICBuYW1lOiAnSEgyJ1xuICAgICAgICBsZXZlbDogMC4yXG4gICAgICAgIGhwOiAwLjZcbiAgICAgICAgZGVjYXk6IDAuMjJcbiAgICAgICAgbm9pc2U6IDFcbiAgICAgICAgcGl0Y2g6IDAuNVxuICAgICAgICBiZW5kOiAwXG4gICAgICAgIGZtOiAwXG4gICAgICAgIGZtRGVjYXk6IDBcbiAgICAgICAgZm1GcmVxOiAwXG4gICAgICB9XG4gICAgXVxuXG4gIEBkZWZhdWx0RHJ1bTogKGRydW1zKSAtPlxuICAgIGtleTogZG8gPT5cbiAgICAgIGtleSA9IDBcbiAgICAgIGtleSArPSAxIHdoaWxlIGRydW1zLnNvbWUgKGRydW0pIC0+IGRydW0ua2V5ID09IGtleVxuICAgICAga2V5XG4gICAgbmFtZTogXCJEcnVtICN7ZHJ1bXMubGVuZ3RoICsgMX1cIlxuICAgIGxldmVsOiAwLjVcbiAgICBocDogMFxuICAgIGRlY2F5OiAwLjVcbiAgICBub2lzZTogMC41XG4gICAgcGl0Y2g6IDAuNVxuICAgIGJlbmQ6IDBcbiAgICBmbTogMFxuICAgIGZtRGVjYXk6IDBcbiAgICBmbUZyZXE6IDBcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgdG8gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bS5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiB7fVxuICAgICAgZmlsdGVyczogKFxuICAgICAgICBoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uMTI3XVxuICAgICAgKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgICAgIHJldHVybiBtZW1vIGlmIGVsYXBzZWQgPiBkcnVtLmRlY2F5XG5cbiAgICAgIGVudiA9IHNpbXBsZUVudmVsb3BlIGRydW0uZGVjYXksIGVsYXBzZWRcbiAgICAgIGZyZXEgPSBtaW5GcmVxICsgZHJ1bS5waXRjaCAqIGZyZXFTY2FsZVxuXG4gICAgICAjIGFwcGx5IHBpdGNoIGJlbmRcbiAgICAgIGlmIGRydW0uYmVuZFxuICAgICAgICBmcmVxID0gKDIgLSBkcnVtLmJlbmQgKyBkcnVtLmJlbmQgKiBlbnYpIC8gMiAqIGZyZXFcblxuICAgICAgIyBhcHBseSBmbVxuICAgICAgaWYgZHJ1bS5mbSA+IDBcbiAgICAgICAgc2lnbmFsID0gb3NjaWxsYXRvcnMuc2luZSBlbGFwc2VkLCBtaW5GcmVxICsgZHJ1bS5mbUZyZXEgKiBmcmVxU2NhbGVcbiAgICAgICAgZnJlcSArPSBkcnVtLmZtICogc2lnbmFsICogc2ltcGxlRW52ZWxvcGUoZHJ1bS5mbURlY2F5ICsgMC4wMSwgZWxhcHNlZClcblxuICAgICAgIyBzdW0gbm9pc2UgYW5kIG9zY2lsbGF0b3JcbiAgICAgIHNhbXBsZSA9IChcbiAgICAgICAgKDEgLSBkcnVtLm5vaXNlKSAqIG9zY2lsbGF0b3JzLnNpbmUoZWxhcHNlZCwgZnJlcSkgK1xuICAgICAgICBkcnVtLm5vaXNlICogb3NjaWxsYXRvcnMubm9pc2UoKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGhpZ2hwYXNzXG4gICAgICBpZiBkcnVtLmhwID4gMFxuICAgICAgICBzYW1wbGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tkcnVtLmtleV0gc2FtcGxlLCBkcnVtLmhwXG5cbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ICogc2FtcGxlXG5cbiAgICAsIDApXG5cblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24pIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbbm90ZS5rZXldID0ge3RpbWUsIGksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG5cbiIsIk1vZGVsID0gcmVxdWlyZSAnLi9tb2RlbCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuLi91dGlsL3JpbmdfYnVmZmVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEluc3RydW1lbnQgZXh0ZW5kcyBNb2RlbFxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXSA9XG4gICAgICBub3RlczogbmV3IFJpbmdCdWZmZXIgaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnksIEFycmF5LCBpbnN0cnVtZW50LnBvbHlwaG9ueVxuXG4gIEByZWxlYXNlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBkZWxldGUgc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIDBcblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24pIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG4gICAgaW5zdHJ1bWVudFN0YXRlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgICBpZiBpbnN0cnVtZW50LnBvbHlwaG9ueSAhPSBpbnN0cnVtZW50U3RhdGUubm90ZXMubGVuZ3RoXG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucmVzaXplIGluc3RydW1lbnQucG9seXBob255XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucHVzaChcbiAgICAgICAge3RpbWUsIGksIGtleTogbm90ZS5rZXksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG4gICAgICApIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuLi91dGlsL3JpbmdfYnVmZmVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvb3BTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIGRlZmF1bHRzOlxuICAgIGxldmVsOiAwLjVcbiAgICBwb2x5cGhvbnk6IDFcbiAgICBzbGljZXM6IFtdXG4iLCJkZWVwTWVyZ2UgPSByZXF1aXJlICcuLi91dGlsL2RlZXBfbWVyZ2UnXG5jdWlkID0gcmVxdWlyZSAnY3VpZCdcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1vZGVsXG5cbiAgIyBkZWZhdWx0IGF0dHJpYnV0ZXNcbiAgQGRlZmF1bHRzOiB7fVxuXG4gIEBidWlsZDogKGRhdGEgPSB7fSkgLT5cbiAgICBkYXRhLl9pZCA9IGN1aWQoKSB1bmxlc3MgZGF0YS5faWQ/XG5cbiAgICBkZWZhdWx0cyA9XG4gICAgICBpZiB0eXBlb2YgQGRlZmF1bHRzIGlzICdmdW5jdGlvbidcbiAgICAgIHRoZW4gQGRlZmF1bHRzKClcbiAgICAgIGVsc2UgQGRlZmF1bHRzXG5cbiAgICBkZWVwTWVyZ2UgZGVmYXVsdHMsIGRhdGFcbiIsIk1vZGVsID0gcmVxdWlyZSAnLi9tb2RlbCdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZXF1ZW5jZSBleHRlbmRzIE1vZGVsXG5cbiAgQGRlZmF1bHRzOlxuICAgIGxvb3BTaXplOiA0XG4gICAgbm90ZXM6IHt9XG5cbiAgQG5vdGVzT246IChzZXF1ZW5jZSwgYmVhdCwgbGFzdEJlYXQpIC0+XG4gICAgYmFyID0gTWF0aC5mbG9vciBiZWF0IC8gc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmFyID0gTWF0aC5mbG9vciBsYXN0QmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgYmVhdCA9IGJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGxhc3RCZWF0ID0gbGFzdEJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuXG4gICAgcmVzdWx0ID0gW11cbiAgICBmb3IgaWQsIG5vdGUgb2Ygc2VxdWVuY2Uubm90ZXNcbiAgICAgIGlmIG5vdGUuc3RhcnQgPCBiZWF0IGFuZCAobm90ZS5zdGFydCA+PSBsYXN0QmVhdCBvciBiYXIgPiBsYXN0QmFyKVxuICAgICAgICByZXN1bHQucHVzaCBub3RlXG5cbiAgICByZXN1bHQiLCJUcmFjayA9IHJlcXVpcmUgJy4vdHJhY2snXG5cbiMgdGhlcmUgYXJlIHRocmVlIHRpbWUgc2NhbGVzIHRoYXQgd2UgYXJlIGNvbmNlcm5lZCB3aXRoXG4jXG4jIC0gc2FtcGxlIHJhdGVcbiMgcnVucyBhdCA0NDEwMCBoeiwgb25jZSBmb3IgZWFjaCBzYW1wbGUgb2YgYXVkaW8gd2Ugb3V0cHV0LiAgQW55IGNvZGUgcnVubmluZ1xuIyBhdCB0aGlzIHJhdGUgaGFzIGEgaGlnaCBjb3N0LCBzbyBwZXJmb3JtYW5jZSBpcyBpbXBvcnRhbnQgaGVyZVxuI1xuIyAtIHRpY2sgcmF0ZVxuIyBUaWNrcyBydW4gZXZlcnkgbiBzYW1wbGVzLCBkZWZpbmVkIHVzaW5nIHRoZSBjbG9ja1JhdGlvIHZhcmlhYmxlLiAgVGhpc1xuIyBhbGxvd3MgdXMgdG8gZG8gcHJvY2Vzc2luZyB0aGF0IG5lZWRzIHRvIHJ1biBmcmVxdWVudGx5LCBidXQgaXMgdG9vIGV4cGVuc2l2ZVxuIyB0byBydW4gZm9yIGVhY2ggc21hcGxlLiAgRm9yIGV4YW1wbGUsIHRoaXMgaXMgdGhlIHRpbWUgcmVzb2x1dGlvbiBhdCB3aGljaFxuIyB3ZSB0cmlnZ2VyIG5ldyBub3Rlcy5cbiNcbiMgLSBmcmFtZSByYXRlXG4jIFRoZSBmcmFtZSByYXRlIGlzIHRoZSBzcGVlZCBhdCB3aGljaCB3ZSB0cmlnZ2VyIEdVSSB1cGRhdGVzIGZvciB0aGluZ3MgbGlrZVxuIyBsZXZlbCBtZXRlcnMgYW5kIHBsYXliYWNrIHBvc2l0aW9uLiAgd2UgY29udGludWUgdG8gcnVuIGZyYW1lIHVwZGF0ZXMgd2hldGhlclxuIyBvbiBub3QgYXVkaW8gaXMgcGxheWluZ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU29uZ1xuXG4gICMgbnVtYmVyIG9mIHNhbXBsZXMgdG8gcHJvY2VzcyBiZXR3ZWVuIHRpY2tzXG4gIGNsb2NrUmF0aW8gPSA1MDBcblxuICAjIHJhdGUgYXQgd2hpY2ggbGV2ZWwgbWV0ZXJzIGRlY2F5XG4gIG1ldGVyRGVjYXkgPSAwLjA1XG5cbiAgY2xpcCA9IChzYW1wbGUpIC0+XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oMiwgc2FtcGxlICsgMSkpIC0gMVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBsYXN0QmVhdCA9IDBcblxuICAgICMga2VlcCBtdXRhYmxlIHN0YXRlIGZvciBhdWRpbyBwbGF5YmFjayBoZXJlIC0gdGhpcyB3aWxsIHN0b3JlIHRoaW5nc1xuICAgICMgbGlrZSBmaWx0ZXIgbWVtb3J5IGFuZCBtZXRlciBsZXZlbHMgdGhhdCBuZWVkIHRvIHN0YXkgb3V0c2lkZSB0aGUgbm9ybWFsXG4gICAgIyBjdXJzb3Igc3RydWN0dXJlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG4gICAgQHN0YXRlID0ge31cblxuICAgICMga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBzb25nIGRvY3VtZW50XG4gICAgQGRhdGEgPSBudWxsXG5cbiAgdXBkYXRlOiAoZGF0YSkgLT5cbiAgICBAZGF0YSA9IGRhdGFcblxuICAjIGZpbGwgYSBidWZmZXIgZnVuY3Rpb25cbiAgYnVmZmVyOiAoc2l6ZSwgaW5kZXgsIHNhbXBsZVJhdGUsIGNiKSAtPlxuICAgIGFyciA9IG5ldyBGbG9hdDMyQXJyYXkgc2l6ZVxuXG4gICAgaWYgQGRhdGE/XG4gICAgICBmb3IgaSBpbiBbMC4uLnNpemVdXG4gICAgICAgIGlpID0gaSArIGluZGV4XG4gICAgICAgIHQgPSBpaSAvIHNhbXBsZVJhdGVcbiAgICAgICAgYXJyW2ldID0gQHNhbXBsZSB0LCBpaVxuXG4gICAgY2IgYXJyLmJ1ZmZlclxuXG4gICMgY2FsbGVkIGZvciBldmVyeSBzYW1wbGUgb2YgYXVkaW9cbiAgc2FtcGxlOiAodGltZSwgaSkgPT5cbiAgICBAdGljayB0aW1lLCBpIGlmIGkgJSBjbG9ja1JhdGlvIGlzIDBcblxuICAgIGNsaXAgQGRhdGEudHJhY2tzLnJlZHVjZSgobWVtbywgdHJhY2spID0+XG4gICAgICBtZW1vICsgVHJhY2suc2FtcGxlIEBzdGF0ZSwgdHJhY2ssIHRpbWUsIGlcbiAgICAsIDApXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IGNsb2NrUmF0aW8gc2FtcGxlc1xuICB0aWNrOiAodGltZSwgaSkgPT5cbiAgICBicHMgPSBAZGF0YS5icG0gLyA2MFxuICAgIGJlYXQgPSB0aW1lICogYnBzXG5cbiAgICBAZGF0YS50cmFja3MuZm9yRWFjaCAodHJhY2spID0+XG4gICAgICBUcmFjay50aWNrIEBzdGF0ZSwgdHJhY2ssIHRpbWUsIGksIGJlYXQsIEBsYXN0QmVhdCwgYnBzXG5cbiAgICBAbGFzdEJlYXQgPSBiZWF0XG5cbiAgIyBjYWxsZWQgcGVyaW9kaWNhbGx5IHRvIHBhc3MgaGlnaCBmcmVxdWVuY3kgZGF0YSB0byB0aGUgdWlcbiAgIyB0aGlzIHNob3VsZCBldmVudHVhbGx5IGJlIHVwZGF0ZWQgdG8gYmFzZSB0aGUgYW1vdW50IG9mIGRlY2F5IG9uIHRoZSBhY3R1YWxcbiAgIyBlbHBhc2VkIHRpbWUgYmVjYXVzZSB0aGUgcmF0ZSBvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgaXMgbm90IGdhdXJhbnRlZWRcbiAgcHJvY2Vzc0ZyYW1lOiAtPlxuICAgIGlmIEBkYXRhP1xuICAgICAgIyBhcHBseSBkZWNheSB0byBtZXRlciBsZXZlbHNcbiAgICAgIGZvciB0cmFjayBpbiBAZGF0YS50cmFja3NcbiAgICAgICAgaWYgQHN0YXRlW3RyYWNrLl9pZF0/XG4gICAgICAgICAgQHN0YXRlW3RyYWNrLl9pZF0ubWV0ZXJMZXZlbCAtPSBtZXRlckRlY2F5XG5cbiAgIyBnZXQgYSBzZW5kYWJsZSB2ZXJzaW9uIG9mIGN1cnJlbnQgc29uZyBwbGF5YmFjayBzdGF0ZVxuICBnZXRTdGF0ZTogLT5cbiAgICBtZXRlckxldmVsczogQGRhdGEudHJhY2tzLnJlZHVjZSgobWVtbywgdHJhY2spID0+XG4gICAgICBtZW1vW3RyYWNrLl9pZF0gPSBAc3RhdGVbdHJhY2suX2lkXT8ubWV0ZXJMZXZlbFxuICAgICAgbWVtb1xuICAgICwge30pXG4iLCJNb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5TZXF1ZW5jZSA9IHJlcXVpcmUgJy4vc2VxdWVuY2UnXG5sb2dTYW1wbGUgPSByZXF1aXJlICcuLi91dGlsL2xvZ19zYW1wbGUnXG5cbmluc3RydW1lbnRUeXBlcyA9XG4gIEFuYWxvZ1N5bnRoZXNpemVyOiByZXF1aXJlICcuL2FuYWxvZ19zeW50aGVzaXplcidcbiAgQmFzaWNTYW1wbGVyOiByZXF1aXJlICcuL2Jhc2ljX3NhbXBsZXInXG4gIERydW1TYW1wbGVyOiByZXF1aXJlICcuL2RydW1fc2FtcGxlcidcbiAgRHJ1bVN5bnRoZXNpemVyOiByZXF1aXJlICcuL2RydW1fc3ludGhlc2l6ZXInXG4gIExvb3BTYW1wbGVyOiByZXF1aXJlICcuL2xvb3Bfc2FtcGxlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRyYWNrIGV4dGVuZHMgTW9kZWxcblxuICBAZGVmYXVsdHM6IC0+XG4gICAgbmFtZTogJ1RyYWNrJ1xuICAgIHNlcXVlbmNlOiBTZXF1ZW5jZS5idWlsZCgpXG4gICAgZWZmZWN0czogW11cblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgc3RhdGVbdHJhY2suX2lkXSA9XG4gICAgICBtZXRlckxldmVsOiAwXG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCB0cmFjaykgLT5cbiAgICBkZWxldGUgc3RhdGVbdHJhY2suX2lkXVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGkpIC0+XG4gICAgIyBnZXQgaW5zdHJ1bWVudCBvdXRwdXRcbiAgICBJbnN0cnVtZW50ID0gaW5zdHJ1bWVudFR5cGVzW3RyYWNrLmluc3RydW1lbnQuX3R5cGVdXG4gICAgc2FtcGxlID0gSW5zdHJ1bWVudC5zYW1wbGUgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGlcblxuICAgICMgYXBwbHkgZWZmZWN0c1xuICAgIHNhbXBsZSA9IHRyYWNrLmVmZmVjdHMucmVkdWNlKChzYW1wbGUsIGVmZmVjdCkgLT5cbiAgICAgIEVmZmVjdC5zYW1wbGUgc3RhdGUsIGVmZmVjdCwgdGltZSwgaSwgc2FtcGxlXG4gICAgLCBzYW1wbGUpXG5cbiAgICAjIHVwZGF0ZSBtZXRlciBsZXZlbHNcbiAgICBpZiB0cmFja1N0YXRlID0gc3RhdGVbdHJhY2suX2lkXVxuICAgICAgbGV2ZWwgPSB0cmFja1N0YXRlLm1ldGVyTGV2ZWxcbiAgICAgIGlmIG5vdCBsZXZlbD8gb3IgaXNOYU4obGV2ZWwpIG9yIHNhbXBsZSA+IGxldmVsXG4gICAgICAgIHRyYWNrU3RhdGUubWV0ZXJMZXZlbCA9IHNhbXBsZVxuXG4gICAgc2FtcGxlXG5cbiAgQHRpY2s6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGksIGJlYXQsIGxhc3RCZWF0LCBicHMpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCB0cmFjayB1bmxlc3Mgc3RhdGVbdHJhY2suX2lkXT9cblxuICAgIEluc3RydW1lbnQgPSBpbnN0cnVtZW50VHlwZXNbdHJhY2suaW5zdHJ1bWVudC5fdHlwZV1cbiAgICBub3Rlc09uID0gU2VxdWVuY2Uubm90ZXNPbiB0cmFjay5zZXF1ZW5jZSwgYmVhdCwgbGFzdEJlYXRcbiAgICBJbnN0cnVtZW50LnRpY2sgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPblxuICAgIHRyYWNrLmVmZmVjdHMuZm9yRWFjaCAoZSkgLT4gZS50aWNrIHN0YXRlLCB0aW1lLCBiZWF0LCBicHNcbiIsImlzT2JqZWN0ID0gKG8pIC0+IG8/IGFuZCB0b1N0cmluZy5jYWxsKG8pIGlzICdbb2JqZWN0IE9iamVjdF0nXG5cbm1vZHVsZS5leHBvcnRzID0gZGVlcE1lcmdlID0gKHNyYywgZGF0YSkgLT5cblxuICBkc3QgPSBpZiBBcnJheS5pc0FycmF5IHNyYyB0aGVuIFtdIGVsc2Uge31cblxuICBmb3Iga2V5IG9mIHNyY1xuICAgIGRzdFtrZXldID0gc3JjW2tleV1cblxuICBmb3Iga2V5IG9mIGRhdGFcbiAgICBpZiBpc09iamVjdChkYXRhW2tleV0pIGFuZCBpc09iamVjdChzcmNba2V5XSlcbiAgICAgIGRzdFtrZXldID0gZGVlcE1lcmdlIHNyY1trZXldLCBkYXRhW2tleV1cbiAgICBlbHNlXG4gICAgICBkc3Rba2V5XSA9IGRhdGFba2V5XVxuXG4gIGRzdFxuIiwiaSA9IDBcbm1vZHVsZS5leHBvcnRzID0gKHYpIC0+XG4gIGNvbnNvbGUubG9nKHYpIGlmIGkgPT0gMFxuICBpID0gKGkgKyAxKSAlIDcwMDBcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmluZ0J1ZmZlclxuICBcbiAgY29uc3RydWN0b3I6IChAbWF4TGVuZ3RoLCBAVHlwZSA9IEZsb2F0MzJBcnJheSwgQGxlbmd0aCkgLT5cbiAgICBAbGVuZ3RoIHx8PSBAbWF4TGVuZ3RoXG4gICAgQGFycmF5ID0gbmV3IFR5cGUgQG1heExlbmd0aFxuICAgIEBwb3MgPSAwXG5cbiAgcmVzZXQ6IC0+XG4gICAgQGFycmF5ID0gbmV3IEBUeXBlIEBtYXhMZW5ndGhcbiAgICB0aGlzXG5cbiAgcmVzaXplOiAoQGxlbmd0aCkgLT5cbiAgICBAcG9zID0gMCBpZiBAcG9zID49IEBsZW5ndGhcblxuICBwdXNoOiAoZWwpIC0+XG4gICAgQGFycmF5W0Bwb3NdID0gZWxcbiAgICBAcG9zICs9IDFcbiAgICBAcG9zID0gMCBpZiBAcG9zID09IEBsZW5ndGhcbiAgICB0aGlzXG5cbiAgZm9yRWFjaDogKGZuKSAtPlxuICAgIGB2YXIgaSwgbGVuO1xuICAgIGZvciAoaSA9IHRoaXMucG9zLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBmbih0aGlzLmFycmF5W2ldLCBpKTtcbiAgICB9XG4gICAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5wb3M7IGkgPCBsZW47IGkrKykge1xuICAgICAgZm4odGhpcy5hcnJheVtpXSwgaSk7XG4gICAgfWBcbiAgICB0aGlzXG5cbiAgcmVkdWNlOiAoZm4sIG1lbW8gPSAwKSAtPlxuICAgIEBmb3JFYWNoIChlbCwgaSkgLT5cbiAgICAgIG1lbW8gPSBmbiBtZW1vLCBlbCwgaVxuICAgIG1lbW9cbiIsIi8qKlxuICogY3VpZC5qc1xuICogQ29sbGlzaW9uLXJlc2lzdGFudCBVSUQgZ2VuZXJhdG9yIGZvciBicm93c2VycyBhbmQgbm9kZS5cbiAqIFNlcXVlbnRpYWwgZm9yIGZhc3QgZGIgbG9va3VwcyBhbmQgcmVjZW5jeSBzb3J0aW5nLlxuICogU2FmZSBmb3IgZWxlbWVudCBJRHMgYW5kIHNlcnZlci1zaWRlIGxvb2t1cHMuXG4gKlxuICogRXh0cmFjdGVkIGZyb20gQ0xDVFJcbiAqIFxuICogQ29weXJpZ2h0IChjKSBFcmljIEVsbGlvdHQgMjAxMlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKmdsb2JhbCB3aW5kb3csIG5hdmlnYXRvciwgZG9jdW1lbnQsIHJlcXVpcmUsIHByb2Nlc3MsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uIChhcHApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgbmFtZXNwYWNlID0gJ2N1aWQnLFxuICAgIGMgPSAwLFxuICAgIGJsb2NrU2l6ZSA9IDQsXG4gICAgYmFzZSA9IDM2LFxuICAgIGRpc2NyZXRlVmFsdWVzID0gTWF0aC5wb3coYmFzZSwgYmxvY2tTaXplKSxcblxuICAgIHBhZCA9IGZ1bmN0aW9uIHBhZChudW0sIHNpemUpIHtcbiAgICAgIHZhciBzID0gXCIwMDAwMDAwMDBcIiArIG51bTtcbiAgICAgIHJldHVybiBzLnN1YnN0cihzLmxlbmd0aC1zaXplKTtcbiAgICB9LFxuXG4gICAgcmFuZG9tQmxvY2sgPSBmdW5jdGlvbiByYW5kb21CbG9jaygpIHtcbiAgICAgIHJldHVybiBwYWQoKE1hdGgucmFuZG9tKCkgKlxuICAgICAgICAgICAgZGlzY3JldGVWYWx1ZXMgPDwgMClcbiAgICAgICAgICAgIC50b1N0cmluZyhiYXNlKSwgYmxvY2tTaXplKTtcbiAgICB9LFxuXG4gICAgc2FmZUNvdW50ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjID0gKGMgPCBkaXNjcmV0ZVZhbHVlcykgPyBjIDogMDtcbiAgICAgIGMrKzsgLy8gdGhpcyBpcyBub3Qgc3VibGltaW5hbFxuICAgICAgcmV0dXJuIGMgLSAxO1xuICAgIH0sXG5cbiAgICBhcGkgPSBmdW5jdGlvbiBjdWlkKCkge1xuICAgICAgLy8gU3RhcnRpbmcgd2l0aCBhIGxvd2VyY2FzZSBsZXR0ZXIgbWFrZXNcbiAgICAgIC8vIGl0IEhUTUwgZWxlbWVudCBJRCBmcmllbmRseS5cbiAgICAgIHZhciBsZXR0ZXIgPSAnYycsIC8vIGhhcmQtY29kZWQgYWxsb3dzIGZvciBzZXF1ZW50aWFsIGFjY2Vzc1xuXG4gICAgICAgIC8vIHRpbWVzdGFtcFxuICAgICAgICAvLyB3YXJuaW5nOiB0aGlzIGV4cG9zZXMgdGhlIGV4YWN0IGRhdGUgYW5kIHRpbWVcbiAgICAgICAgLy8gdGhhdCB0aGUgdWlkIHdhcyBjcmVhdGVkLlxuICAgICAgICB0aW1lc3RhbXAgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkpLnRvU3RyaW5nKGJhc2UpLFxuXG4gICAgICAgIC8vIFByZXZlbnQgc2FtZS1tYWNoaW5lIGNvbGxpc2lvbnMuXG4gICAgICAgIGNvdW50ZXIsXG5cbiAgICAgICAgLy8gQSBmZXcgY2hhcnMgdG8gZ2VuZXJhdGUgZGlzdGluY3QgaWRzIGZvciBkaWZmZXJlbnRcbiAgICAgICAgLy8gY2xpZW50cyAoc28gZGlmZmVyZW50IGNvbXB1dGVycyBhcmUgZmFyIGxlc3NcbiAgICAgICAgLy8gbGlrZWx5IHRvIGdlbmVyYXRlIHRoZSBzYW1lIGlkKVxuICAgICAgICBmaW5nZXJwcmludCA9IGFwaS5maW5nZXJwcmludCgpLFxuXG4gICAgICAgIC8vIEdyYWIgc29tZSBtb3JlIGNoYXJzIGZyb20gTWF0aC5yYW5kb20oKVxuICAgICAgICByYW5kb20gPSByYW5kb21CbG9jaygpICsgcmFuZG9tQmxvY2soKTtcblxuICAgICAgICBjb3VudGVyID0gcGFkKHNhZmVDb3VudGVyKCkudG9TdHJpbmcoYmFzZSksIGJsb2NrU2l6ZSk7XG5cbiAgICAgIHJldHVybiAgKGxldHRlciArIHRpbWVzdGFtcCArIGNvdW50ZXIgKyBmaW5nZXJwcmludCArIHJhbmRvbSk7XG4gICAgfTtcblxuICBhcGkuc2x1ZyA9IGZ1bmN0aW9uIHNsdWcoKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKS50b1N0cmluZygzNiksXG4gICAgICBjb3VudGVyLFxuICAgICAgcHJpbnQgPSBhcGkuZmluZ2VycHJpbnQoKS5zbGljZSgwLDEpICtcbiAgICAgICAgYXBpLmZpbmdlcnByaW50KCkuc2xpY2UoLTEpLFxuICAgICAgcmFuZG9tID0gcmFuZG9tQmxvY2soKS5zbGljZSgtMik7XG5cbiAgICAgIGNvdW50ZXIgPSBzYWZlQ291bnRlcigpLnRvU3RyaW5nKDM2KS5zbGljZSgtNCk7XG5cbiAgICByZXR1cm4gZGF0ZS5zbGljZSgtMikgKyBcbiAgICAgIGNvdW50ZXIgKyBwcmludCArIHJhbmRvbTtcbiAgfTtcblxuICBhcGkuZ2xvYmFsQ291bnQgPSBmdW5jdGlvbiBnbG9iYWxDb3VudCgpIHtcbiAgICAvLyBXZSB3YW50IHRvIGNhY2hlIHRoZSByZXN1bHRzIG9mIHRoaXNcbiAgICB2YXIgY2FjaGUgPSAoZnVuY3Rpb24gY2FsYygpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgY291bnQgPSAwO1xuXG4gICAgICAgIGZvciAoaSBpbiB3aW5kb3cpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgfSgpKTtcblxuICAgIGFwaS5nbG9iYWxDb3VudCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNhY2hlOyB9O1xuICAgIHJldHVybiBjYWNoZTtcbiAgfTtcblxuICBhcGkuZmluZ2VycHJpbnQgPSBmdW5jdGlvbiBicm93c2VyUHJpbnQoKSB7XG4gICAgcmV0dXJuIHBhZCgobmF2aWdhdG9yLm1pbWVUeXBlcy5sZW5ndGggK1xuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5sZW5ndGgpLnRvU3RyaW5nKDM2KSArXG4gICAgICBhcGkuZ2xvYmFsQ291bnQoKS50b1N0cmluZygzNiksIDQpO1xuICB9O1xuXG4gIC8vIGRvbid0IGNoYW5nZSBhbnl0aGluZyBmcm9tIGhlcmUgZG93bi5cbiAgaWYgKGFwcC5yZWdpc3Rlcikge1xuICAgIGFwcC5yZWdpc3RlcihuYW1lc3BhY2UsIGFwaSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiAgfSBlbHNlIHtcbiAgICBhcHBbbmFtZXNwYWNlXSA9IGFwaTtcbiAgfVxuXG59KHRoaXMuYXBwbGl0dWRlIHx8IHRoaXMpKTtcbiJdfQ==
