(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Song, song;

Song = require('./dsp/song.coffee');

song = new Song;

self.logSample = require('./dsp/components/log_sample');

self.onmessage = function(e) {
  switch (e.data.type) {
    case 'update':
      return song.update(e.data.state);
    case 'midi':
      return song.midi(e.data.message);
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



},{"./dsp/components/log_sample":7,"./dsp/song.coffee":16}],2:[function(require,module,exports){
var AnalogSynthesizer, Instrument, RingBuffer, envelope, highpassFilter, lowpassFilter, oscillators,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('./components/ring_buffer');

lowpassFilter = require('./components/lowpass_filter');

highpassFilter = require('./components/highpass_filter');

envelope = require('./components/envelope');

oscillators = require('./components/oscillators');

module.exports = AnalogSynthesizer = (function(_super) {
  var frequency, tune;

  __extends(AnalogSynthesizer, _super);

  function AnalogSynthesizer() {
    return AnalogSynthesizer.__super__.constructor.apply(this, arguments);
  }

  tune = 440;

  frequency = function(key) {
    return tune * Math.pow(2, (key - 69) / 12);
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
        if (!(r > time - note.timeOff)) {
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



},{"./components/envelope":4,"./components/highpass_filter":5,"./components/lowpass_filter":8,"./components/oscillators":9,"./components/ring_buffer":10,"./instrument":14}],3:[function(require,module,exports){
var BasicSampler, Instrument, RingBuffer, envelope, highpassFilter, linearInterpolator, lowpassFilter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('./components/ring_buffer');

linearInterpolator = require('./components/linear_interpolator');

lowpassFilter = require('./components/lowpass_filter');

highpassFilter = require('./components/highpass_filter');

envelope = require('./components/envelope');

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
    BasicSampler.__super__.constructor.createState.call(this, state, instrument);
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



},{"./components/envelope":4,"./components/highpass_filter":5,"./components/linear_interpolator":6,"./components/lowpass_filter":8,"./components/ring_buffer":10,"./instrument":14}],4:[function(require,module,exports){
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
  if (note.timeOff) {
    l = l * (note.timeOff + r - time) / r;
  }
  return Math.max(0, l);
};



},{}],5:[function(require,module,exports){
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



},{}],6:[function(require,module,exports){
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



},{}],7:[function(require,module,exports){
var i;

i = 0;

module.exports = function(v) {
  if (i === 0) {
    console.log(v);
  }
  return i = (i + 1) % 7000;
};



},{}],8:[function(require,module,exports){
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



},{}],9:[function(require,module,exports){
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



},{}],10:[function(require,module,exports){
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



},{}],11:[function(require,module,exports){
module.exports = function(decay, elapsed) {
  if (elapsed > decay) {
    return 0;
  } else {
    return 1 - elapsed / decay;
  }
};



},{}],12:[function(require,module,exports){
var DrumSampler, Instrument, envelope, linearInterpolator,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

envelope = require('./components/envelope');

linearInterpolator = require('./components/linear_interpolator');

module.exports = DrumSampler = (function(_super) {
  __extends(DrumSampler, _super);

  function DrumSampler() {
    return DrumSampler.__super__.constructor.apply(this, arguments);
  }

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



},{"./components/envelope":4,"./components/linear_interpolator":6,"./instrument":14}],13:[function(require,module,exports){
var DrumSynthesizer, Instrument, highpassFilter, oscillators, simpleEnvelope,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

highpassFilter = require('./components/highpass_filter');

simpleEnvelope = require('./components/simple_envelope');

oscillators = require('./components/oscillators');

module.exports = DrumSynthesizer = (function(_super) {
  var freqScale, maxFreq, minFreq;

  __extends(DrumSynthesizer, _super);

  function DrumSynthesizer() {
    return DrumSynthesizer.__super__.constructor.apply(this, arguments);
  }

  minFreq = 60;

  maxFreq = 3000;

  freqScale = maxFreq - minFreq;

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



},{"./components/highpass_filter":5,"./components/oscillators":9,"./components/simple_envelope":11,"./instrument":14}],14:[function(require,module,exports){
var Instrument, RingBuffer;

RingBuffer = require('./components/ring_buffer');

module.exports = Instrument = (function() {
  function Instrument() {}

  Instrument.createState = function(state, instrument) {
    return state[instrument._id] = {
      notes: new RingBuffer(instrument.maxPolyphony, Array, instrument.polyphony),
      noteMap: {}
    };
  };

  Instrument.releaseState = function(state, instrument) {
    return delete state[instrument._id];
  };

  Instrument.sample = function(state, instrument, time, i) {
    return 0;
  };

  Instrument.tick = function(state, instrument, time, i, beat, bps, notesOn, notesOff) {
    var instrumentState;
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    instrumentState = state[instrument._id];
    if (instrument.polyphony !== instrumentState.notes.length) {
      instrumentState.notes.resize(instrument.polyphony);
    }
    notesOn.forEach(function(_arg) {
      var key;
      key = _arg.key;
      instrumentState.noteMap[key] = {
        time: time,
        i: i,
        key: key
      };
      return instrumentState.notes.push(instrumentState.noteMap[key]);
    });
    return notesOff.forEach(function(_arg) {
      var key;
      key = _arg.key;
      return instrumentState.noteMap[key].timeOff = time;
    });
  };

  return Instrument;

})();



},{"./components/ring_buffer":10}],15:[function(require,module,exports){
var Instrument, LoopSampler, RingBuffer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Instrument = require('./instrument');

RingBuffer = require('./components/ring_buffer');

module.exports = LoopSampler = (function(_super) {
  __extends(LoopSampler, _super);

  function LoopSampler() {
    return LoopSampler.__super__.constructor.apply(this, arguments);
  }

  return LoopSampler;

})(Instrument);



},{"./components/ring_buffer":10,"./instrument":14}],16:[function(require,module,exports){
var Song, Track,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Track = require('./track');

module.exports = Song = (function() {
  var clip, clockRatio, meterDecay;

  clockRatio = 441;

  meterDecay = 0.05;

  clip = function(sample) {
    return Math.max(0, Math.min(2, sample + 1)) - 1;
  };

  function Song() {
    this.tick = __bind(this.tick, this);
    this.sample = __bind(this.sample, this);
    this.lastBeat = 0;
    this.state = {};
    this.song = null;
    this.midiMessages = [];
  }

  Song.prototype.update = function(state) {
    return this.song = state;
  };

  Song.prototype.midi = function(message) {
    return this.midiMessages.push(message);
  };

  Song.prototype.buffer = function(size, index, sampleRate, cb) {
    var arr, i, ii, t, _i;
    arr = new Float32Array(size);
    if (this.song != null) {
      for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
        ii = i + index;
        t = ii / sampleRate;
        arr[i] = this.sample(t, ii);
      }
    }
    this.midiMessages = [];
    return cb(arr.buffer);
  };

  Song.prototype.sample = function(time, i) {
    if (i % clockRatio === 0) {
      this.tick(time, i);
    }
    return clip(this.song.level * this.song.tracks.reduce((function(_this) {
      return function(memo, track) {
        return memo + Track.sample(_this.state, track, time, i);
      };
    })(this), 0));
  };

  Song.prototype.tick = function(time, i) {
    var beat, bps;
    bps = this.song.bpm / 60;
    beat = time * bps;
    this.song.tracks.forEach((function(_this) {
      return function(track, i) {
        var midiMessages;
        midiMessages = i === 0 ? _this.midiMessages : null;
        return Track.tick(_this.state, track, midiMessages, time, i, beat, _this.lastBeat, bps);
      };
    })(this));
    return this.lastBeat = beat;
  };

  Song.prototype.processFrame = function() {
    var track, _i, _len, _ref, _ref1, _results;
    if (((_ref = this.song) != null ? _ref.tracks : void 0) != null) {
      _ref1 = this.song.tracks;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        track = _ref1[_i];
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
    var _ref, _ref1;
    return {
      meterLevels: (_ref = this.song) != null ? (_ref1 = _ref.tracks) != null ? _ref1.reduce((function(_this) {
        return function(memo, track) {
          var _ref2;
          memo[track._id] = (_ref2 = _this.state[track._id]) != null ? _ref2.meterLevel : void 0;
          return memo;
        };
      })(this), {}) : void 0 : void 0
    };
  };

  return Song;

})();



},{"./track":17}],17:[function(require,module,exports){
var Track, instrumentTypes;

instrumentTypes = {
  AnalogSynthesizer: require('./analog_synthesizer'),
  BasicSampler: require('./basic_sampler'),
  DrumSampler: require('./drum_sampler'),
  DrumSynthesizer: require('./drum_synthesizer'),
  LoopSampler: require('./loop_sampler')
};

module.exports = Track = (function() {
  function Track() {}

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

  Track.tick = function(state, track, midiMessages, time, i, beat, lastBeat, bps) {
    var Instrument, notesOff, notesOn, _ref;
    if (state[track._id] == null) {
      this.createState(state, track);
    }
    Instrument = instrumentTypes[track.instrument._type];
    _ref = this.notes(track.sequence, midiMessages, time, beat, lastBeat), notesOn = _ref.notesOn, notesOff = _ref.notesOff;
    Instrument.tick(state, track.instrument, time, i, beat, bps, notesOn, notesOff);
    return track.effects.forEach(function(e) {
      return e.tick(state, time, beat, bps);
    });
  };

  Track.notes = function(sequence, midiMessages, time, beat, lastBeat) {
    var bar, end, id, lastBar, note, notesOff, notesOn, start, _ref;
    bar = Math.floor(beat / sequence.loopSize);
    lastBar = Math.floor(lastBeat / sequence.loopSize);
    beat = beat % sequence.loopSize;
    lastBeat = lastBeat % sequence.loopSize;
    notesOn = [];
    notesOff = [];
    _ref = sequence.notes;
    for (id in _ref) {
      note = _ref[id];
      start = note.start;
      end = note.start + note.length;
      if (start < beat && (start >= lastBeat || bar > lastBar)) {
        notesOn.push({
          key: note.key
        });
      }
      if (end < beat && (end >= lastBeat || bar > lastBar)) {
        notesOff.push({
          key: note.key
        });
      }
    }
    if (midiMessages != null) {
      midiMessages.forEach(function(message, i) {
        if (message.time < time) {
          midiMessages.splice(i, 1);
          switch (message.type) {
            case 'on':
              return notesOn.push({
                key: message.key
              });
            case 'off':
              return notesOff.push({
                key: message.key
              });
          }
        }
      });
    }
    return {
      notesOn: notesOn,
      notesOff: notesOff
    };
  };

  return Track;

})();



},{"./analog_synthesizer":2,"./basic_sampler":3,"./drum_sampler":12,"./drum_synthesizer":13,"./loop_sampler":15}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL29zY2lsbGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3JpbmdfYnVmZmVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9kcnVtX3N5bnRoZXNpemVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9pbnN0cnVtZW50LmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9sb29wX3NhbXBsZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3NvbmcuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3RyYWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1lBLElBQUEsVUFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLG1CQUFSLENBQVAsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sR0FBQSxDQUFBLElBRlAsQ0FBQTs7QUFBQSxJQUlJLENBQUMsU0FBTCxHQUFpQixPQUFBLENBQVEsNkJBQVIsQ0FKakIsQ0FBQTs7QUFBQSxJQU9JLENBQUMsU0FBTCxHQUFpQixTQUFDLENBQUQsR0FBQTtBQUNmLFVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFkO0FBQUEsU0FDTyxRQURQO2FBRUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQW5CLEVBRko7QUFB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bkIsUUFBQSxJQUFHLE9BQU8sQ0FBQyxJQUFSLEdBQWUsSUFBbEI7QUFDRSxVQUFBLFlBQVksQ0FBQyxNQUFiLENBQW9CLENBQXBCLEVBQXVCLENBQXZCLENBQUEsQ0FBQTtBQUNBLGtCQUFPLE9BQU8sQ0FBQyxJQUFmO0FBQUEsaUJBQ08sSUFEUDtxQkFFSSxPQUFPLENBQUMsSUFBUixDQUFhO0FBQUEsZ0JBQUEsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUFiO2VBQWIsRUFGSjtBQUFBLGlCQUdPLEtBSFA7cUJBSUksUUFBUSxDQUFDLElBQVQsQ0FBYztBQUFBLGdCQUFBLEdBQUEsRUFBSyxPQUFPLENBQUMsR0FBYjtlQUFkLEVBSko7QUFBQSxXQUZGO1NBRG1CO01BQUEsQ0FBckIsQ0FBQSxDQURGO0tBaEJBO1dBMEJBO0FBQUEsTUFBQyxTQUFBLE9BQUQ7QUFBQSxNQUFVLFVBQUEsUUFBVjtNQTNCTTtFQUFBLENBdENSLENBQUE7O2VBQUE7O0lBVkYsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIHRoaXMgc2NyaXB0IGlzIHJ1biBpbnNpZGUgYSB3b3JrZXIgaW4gb3JkZXIgdG8gZG8gYXVkaW8gcHJvY2Vzc2luZyBvdXRzaWRlIG9mXG4jIHRoZSBtYWluIHVpIHRocmVhZC5cbiNcbiMgVGhlIHdvcmtlciByZWNlaXZlcyB0aHJlZSB0eXBlcyBvZiBtZXNzYWdlcyAtICd1cGRhdGUnIHcvIHtzdGF0ZX0gY29udGFpbmluZ1xuIyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc29uZywgJ21pZGknIHcvIHttZXNzYWdlfSBjb250YWluaW5nIGluY29taW5nIG5vdGVPblxuIyBhbmQgbm90ZU9mZiBtZXNzYWdlcywgYW5kICdidWZmZXInIHcvIHtzaXplLCBpbmRleCwgc2FtcGxlUmF0ZX0gcmVxdWVzdGluZ1xuIyBhIGJ1ZmZlciB0byBiZSBmaWxsZWQgYW5kIHNlbnQgYmFjay5cbiNcbiMgSXQgYWxzbyBzZW5kcyB0d28gdHlwZXMgb2YgbWVzc2FnZXMgLSAnZnJhbWUnIG1lc3NhZ2VzIGF0IDYwaHogY29udGFpbmluZyB0aGVcbiMgY3VycmVudCBwbGF5YmFjayBzdGF0ZSBhcyB7ZnJhbWV9LCBhbmQgc2VuZHMgJ2J1ZmZlcicgbWVzc2FnZXMgdHJhbnNmZXJyaW5nXG4jIGZpbGxlZCBBcnJheUJ1ZmZlcnMgaW4gcmVzcG9uc2UgdG8gJ2J1ZmZlcicgcmVxdWVzdHMuXG5cblNvbmcgPSByZXF1aXJlICcuL2RzcC9zb25nLmNvZmZlZSdcblxuc29uZyA9IG5ldyBTb25nXG5cbnNlbGYubG9nU2FtcGxlID0gcmVxdWlyZSAnLi9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlJ1xuXG4jIHJlc3BvbmQgdG8gbWVzc2FnZXMgZnJvbSBwYXJlbnQgdGhyZWFkXG5zZWxmLm9ubWVzc2FnZSA9IChlKSAtPlxuICBzd2l0Y2ggZS5kYXRhLnR5cGVcbiAgICB3aGVuICd1cGRhdGUnXG4gICAgICBzb25nLnVwZGF0ZSBlLmRhdGEuc3RhdGVcbiAgICB3aGVuICdtaWRpJ1xuICAgICAgc29uZy5taWRpIGUuZGF0YS5tZXNzYWdlXG4gICAgd2hlbiAnYnVmZmVyJ1xuICAgICAgc29uZy5idWZmZXIgZS5kYXRhLnNpemUsIGUuZGF0YS5pbmRleCwgZS5kYXRhLnNhbXBsZVJhdGUsIChidWZmZXIpIC0+XG4gICAgICAgIHBvc3RNZXNzYWdlXG4gICAgICAgICAgdHlwZTogJ2J1ZmZlcidcbiAgICAgICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgICAsIFtidWZmZXJdXG5cbiMgdHJpZ2dlciBwcm9jZXNzaW5nIG9uIHNvbmcgYXQgZnJhbWUgcmF0ZSBhbmQgc2VuZCB1cGRhdGVzIHRvIHRoZSBwYXJlbnQgdGhyZWFkXG5zZXRJbnRlcnZhbCAtPlxuICBzb25nLnByb2Nlc3NGcmFtZSgpXG4gIHBvc3RNZXNzYWdlXG4gICAgdHlwZTogJ2ZyYW1lJ1xuICAgIGZyYW1lOiBzb25nLmdldFN0YXRlKClcbiwgMTAwMCAvIDYwXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxvd3Bhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbG93cGFzc19maWx0ZXInXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQW5hbG9nU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgdHVuZSA9IDQ0MFxuICBmcmVxdWVuY3kgPSAoa2V5KSAtPlxuICAgIHR1bmUgKiBNYXRoLnBvdyAyLCAoa2V5IC0gNjkpIC8gMTJcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdXBlciBzdGF0ZSwgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgciA9IE1hdGgubWF4IDAuMDEsIGluc3RydW1lbnQudm9sdW1lRW52LnJcbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyByID4gdGltZSAtIG5vdGUudGltZU9mZlxuXG4gICAgICAjIHN1bSBvc2NpbGxhdG9ycyBhbmQgYXBwbHkgdm9sdW1lIGVudmVsb3BlXG4gICAgICBvc2MxRnJlcSA9IGZyZXF1ZW5jeSBub3RlLmtleSArIGluc3RydW1lbnQub3NjMS50dW5lIC0gMC41ICsgTWF0aC5yb3VuZCgyNCAqIChpbnN0cnVtZW50Lm9zYzEucGl0Y2ggLSAwLjUpKVxuICAgICAgb3NjMkZyZXEgPSBmcmVxdWVuY3kgbm90ZS5rZXkgKyBpbnN0cnVtZW50Lm9zYzIudHVuZSAtIDAuNSArIE1hdGgucm91bmQoMjQgKiAoaW5zdHJ1bWVudC5vc2MyLnBpdGNoIC0gMC41KSlcbiAgICAgIHNhbXBsZSA9IGVudmVsb3BlKGluc3RydW1lbnQudm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChcbiAgICAgICAgaW5zdHJ1bWVudC5vc2MxLmxldmVsICogb3NjaWxsYXRvcnNbaW5zdHJ1bWVudC5vc2MxLndhdmVmb3JtXSh0aW1lLCBvc2MxRnJlcSkgK1xuICAgICAgICBpbnN0cnVtZW50Lm9zYzIubGV2ZWwgKiBvc2NpbGxhdG9yc1tpbnN0cnVtZW50Lm9zYzIud2F2ZWZvcm1dKHRpbWUsIG9zYzJGcmVxKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGZpbHRlciB3aXRoIGVudmVsb3BlXG4gICAgICBjdXRvZmYgPSBNYXRoLm1pbiAxLCBpbnN0cnVtZW50LmZpbHRlci5mcmVxICsgaW5zdHJ1bWVudC5maWx0ZXIuZW52ICogZW52ZWxvcGUoaW5zdHJ1bWVudC5maWx0ZXJFbnYsIG5vdGUsIHRpbWUpXG4gICAgICBmaWx0ZXIgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tpbnN0cnVtZW50LmZpbHRlci50eXBlXVtpbmRleF1cbiAgICAgIHNhbXBsZSA9IGZpbHRlciBzYW1wbGUsIGN1dG9mZiwgaW5zdHJ1bWVudC5maWx0ZXIucmVzXG5cbiAgICAgICMgcmV0dXJuIHJlc3VsdFxuICAgICAgbWVtbyArIHNhbXBsZVxuXG4gICAgLCAwKVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5saW5lYXJJbnRlcnBvbGF0b3IgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvcidcbmxvd3Bhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbG93cGFzc19maWx0ZXInXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEJhc2ljU2FtcGxlciBleHRlbmRzIEluc3RydW1lbnRcblxuICBAZGVmYXVsdHM6XG4gICAgX3R5cGU6ICdCYXNpY1NhbXBsZXInXG4gICAgbGV2ZWw6IDAuNVxuICAgIHBhbjogMC41XG4gICAgcG9seXBob255OiAxXG4gICAgbWF4UG9seXBob255OiA2XG4gICAgcm9vdEtleTogNjBcbiAgICBzYW1wbGVEYXRhOiBudWxsXG4gICAgc2FtcGxlTmFtZTogJydcbiAgICBzdGFydDogMC4zXG4gICAgbG9vcEFjdGl2ZTogJ2xvb3AnXG4gICAgbG9vcDogMC43XG4gICAgdHVuZTogMC41XG4gICAgdm9sdW1lRW52OlxuICAgICAgYTogMFxuICAgICAgZDogMC4yNVxuICAgICAgczogMVxuICAgICAgcjogMC41XG4gICAgZmlsdGVyRW52OlxuICAgICAgYTogMFxuICAgICAgZDogMC4yNVxuICAgICAgczogMVxuICAgICAgcjogMC41XG4gICAgZmlsdGVyOlxuICAgICAgdHlwZTogJ25vbmUnXG4gICAgICBmcmVxOiAwLjI3XG4gICAgICByZXM6IDAuMDVcbiAgICAgIGVudjogMC40NVxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN1cGVyIHN0YXRlLCBpbnN0cnVtZW50XG5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVycyA9XG4gICAgICBMUDogKGxvd3Bhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIEhQOiAoaGlnaHBhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIG5vbmU6ICgoKHNhbXBsZSkgLT4gc2FtcGxlKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cbiAgICByZXR1cm4gMCB1bmxlc3MgaW5zdHJ1bWVudC5zYW1wbGVEYXRhP1xuXG4gICAgciA9IE1hdGgubWF4IDAuMDEsIGluc3RydW1lbnQudm9sdW1lRW52LnJcblxuICAgIGluc3RydW1lbnQubGV2ZWwgKiBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXMucmVkdWNlKChtZW1vLCBub3RlLCBpbmRleCkgPT5cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGUubGVuICsgciA+IHRpbWUgLSBub3RlLnRpbWVcblxuICAgICAgIyBnZXQgcGl0Y2ggc2hpZnRlZCBpbnRlcnBvbGF0ZWQgc2FtcGxlIGFuZCBhcHBseSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIHRyYW5zcG9zZSA9IG5vdGUua2V5IC0gaW5zdHJ1bWVudC5yb290S2V5ICsgaW5zdHJ1bWVudC50dW5lIC0gMC41XG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgaW5zdHJ1bWVudC5zdGFydCAqIGluc3RydW1lbnQuc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIGxvb3BQb2ludCA9IE1hdGguZmxvb3IgaW5zdHJ1bWVudC5sb29wICogaW5zdHJ1bWVudC5zYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgc2FtcGxlID0gbGluZWFySW50ZXJwb2xhdG9yIGluc3RydW1lbnQuc2FtcGxlRGF0YSwgdHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0LCBpbnN0cnVtZW50Lmxvb3BBY3RpdmUgPT0gJ2xvb3AnLCBsb29wUG9pbnRcbiAgICAgIHNhbXBsZSA9IGVudmVsb3BlKGluc3RydW1lbnQudm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChzYW1wbGUgb3IgMClcblxuICAgICAgIyBhcHBseSBmaWx0ZXIgd2l0aCBlbnZlbG9wZVxuICAgICAgY3V0b2ZmID0gTWF0aC5taW4gMSwgaW5zdHJ1bWVudC5maWx0ZXIuZnJlcSArIGluc3RydW1lbnQuZmlsdGVyLmVudiAqIGVudmVsb3BlKGluc3RydW1lbnQuZmlsdGVyRW52LCBub3RlLCB0aW1lKVxuICAgICAgZmlsdGVyID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnNbaW5zdHJ1bWVudC5maWx0ZXIudHlwZV1baW5kZXhdXG4gICAgICBzYW1wbGUgPSBmaWx0ZXIgc2FtcGxlLCBjdXRvZmYsIGluc3RydW1lbnQuZmlsdGVyLnJlc1xuXG4gICAgICAjIHJldHVybiByZXN1bHRcbiAgICAgIG1lbW8gKyBzYW1wbGVcblxuICAgICwgMClcbiIsIm1pbkVudlZhbHVlID0gMC4wMVxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbnYsIG5vdGUsIHRpbWUpIC0+XG5cbiAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgYSA9IE1hdGgubWF4IG1pbkVudlZhbHVlLCBlbnYuYVxuICBkID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5kXG4gIHMgPSBlbnYuc1xuICByID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5yXG5cbiAgIyBhdHRhY2ssIGRlY2F5LCBzdXN0YWluXG4gIGwgPSBpZiBlbGFwc2VkID4gYSArIGRcbiAgICBsID0gc1xuICBlbHNlIGlmIGVsYXBzZWQgPiBhXG4gICAgbCA9IHMgKyAoMSAtIHMpICogKGEgKyBkIC0gZWxhcHNlZCkgLyBkXG4gIGVsc2VcbiAgICBlbGFwc2VkIC8gYVxuXG4gICMgcmVsZWFzZVxuICBpZiBub3RlLnRpbWVPZmZcbiAgICBsID0gbCAqIChub3RlLnRpbWVPZmYgKyByIC0gdGltZSkgLyByXG5cbiAgTWF0aC5tYXggMCwgbFxuIiwic2FtcGxlUmF0ZSA9IDQ4MDAwXG5tYXhGcmVxID0gMTIwMDBcbmRiR2FpbiA9IDEyICAgICMgZ2FpbiBvZiBmaWx0ZXJcbmJhbmR3aWR0aCA9IDEgICMgYmFuZHdpZHRoIGluIG9jdGF2ZXNcblxuIyBjb25zdGFudHNcbkEgPSBNYXRoLnBvdygxMCwgZGJHYWluIC8gNDApXG5lID0gTWF0aC5sb2coMilcbnRhdSA9IDIgKiBNYXRoLlBJXG5iZXRhID0gTWF0aC5zcXJ0KDIgKiBBKVxuXG4jIGh5cGVyYm9saWMgc2luIGZ1bmN0aW9uXG5zaW5oID0gKHgpIC0+XG4gIHkgPSBNYXRoLmV4cCB4XG4gICh5IC0gMSAvIHkpIC8gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGEwID0gYTEgPSBhMiA9IGEzID0gYTQgPSB4MSA9IHgyID0geTEgPSB5MiA9IDBcbiAgZnJlcSA9IG9tZWdhID0gc24gPSBhbHBoYSA9IDBcbiAgY3MgPSAxXG5cbiAgbGFzdEN1dG9mZiA9IDBcblxuICAoc2FtcGxlLCBjdXRvZmYpIC0+XG4gICAgIyBjYWNoZSBmaWx0ZXIgdmFsdWVzIHVudGlsIGN1dG9mZiBjaGFuZ2VzXG4gICAgaWYgY3V0b2ZmICE9IGxhc3RDdXRvZmZcbiAgXG4gICAgICBvbGRDdXRvZmYgPSBjdXRvZmZcblxuICAgICAgZnJlcSA9IGN1dG9mZiAqIG1heEZyZXFcbiAgICAgIG9tZWdhID0gdGF1ICogZnJlcSAvIHNhbXBsZVJhdGVcbiAgICAgIHNuID0gTWF0aC5zaW4gb21lZ2FcbiAgICAgIGNzID0gTWF0aC5jb3Mgb21lZ2FcbiAgICAgIGFscGhhID0gc24gKiBzaW5oKGUgLyAyICogYmFuZHdpZHRoICogb21lZ2EgLyBzbilcblxuICAgICAgYjAgPSAoMSArIGNzKSAvIDJcbiAgICAgIGIxID0gLSgxICsgY3MpXG4gICAgICBiMiA9ICgxICsgY3MpIC8gMlxuICAgICAgYWEwID0gMSArIGFscGhhXG4gICAgICBhYTEgPSAtMiAqIGNzXG4gICAgICBhYTIgPSAxIC0gYWxwaGFcblxuICAgICAgYTAgPSBiMCAvIGFhMFxuICAgICAgYTEgPSBiMSAvIGFhMFxuICAgICAgYTIgPSBiMiAvIGFhMFxuICAgICAgYTMgPSBhYTEgLyBhYTBcbiAgICAgIGE0ID0gYWEyIC8gYWEwXG5cbiAgICAjIGNvbXB1dGUgcmVzdWx0XG4gICAgcyA9IE1hdGgubWF4IC0xLCBNYXRoLm1pbiAxLCBzYW1wbGVcbiAgICByZXN1bHQgPSBhMCAqIHMgKyBhMSAqIHgxICsgYTIgKiB4MiAtIGEzICogeTEgLSBhNCAqIHkyXG5cbiAgICAjIHNoaWZ0IHgxIHRvIHgyLCBzYW1wbGUgdG8geDFcbiAgICB4MiA9IHgxXG4gICAgeDEgPSBzXG5cbiAgICAjIHNoaWZ0IHkxIHRvIHkyLCByZXN1bHQgdG8geTFcbiAgICB5MiA9IHkxXG4gICAgeTEgPSByZXN1bHRcblxuICAgIHJlc3VsdCIsIm1vZHVsZS5leHBvcnRzID0gKHNhbXBsZURhdGEsIHRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldCA9IDAsIGxvb3BBY3RpdmUgPSBmYWxzZSwgbG9vcFBvaW50KSAtPlxuICBpID0gc2FtcGxlc0VsYXBzZWQgKiBNYXRoLnBvdyAyLCB0cmFuc3Bvc2UgLyAxMlxuICBpMSA9IE1hdGguZmxvb3IgaVxuICBpMSA9IGkxICUgKGxvb3BQb2ludCAtIG9mZnNldCkgaWYgbG9vcEFjdGl2ZVxuICBpMiA9IGkxICsgMVxuICBsID0gaSAlIDFcblxuICBzYW1wbGVEYXRhW29mZnNldCArIGkxXSAqICgxIC0gbCkgKyBzYW1wbGVEYXRhW29mZnNldCArIGkyXSAqIGwiLCJpID0gMFxubW9kdWxlLmV4cG9ydHMgPSAodikgLT5cbiAgY29uc29sZS5sb2codikgaWYgaSA9PSAwXG4gIGkgPSAoaSArIDEpICUgNzAwMFxuIiwic2FtcGxlUmF0ZSA9IDQ4MDAwXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cblxuICB5MSA9IHkyID0geTMgPSB5NCA9IG9sZHggPSBvbGR5MSA9IG9sZHkyID0gb2xkeTMgPSAwXG4gIHAgPSBrID0gdDEgPSB0MiA9IHIgPSB4ID0gbnVsbFxuXG4gIChzYW1wbGUsIGN1dG9mZiwgcmVzKSAtPlxuICAgIGZyZXEgPSAyMCAqIE1hdGgucG93IDEwLCAzICogY3V0b2ZmXG4gICAgZnJlcSA9IGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgcCA9IGZyZXEgKiAoMS44IC0gKDAuOCAqIGZyZXEpKVxuICAgIGsgPSAyICogTWF0aC5zaW4oZnJlcSAqIE1hdGguUEkgLyAyKSAtIDFcbiAgICB0MSA9ICgxIC0gcCkgKiAxLjM4NjI0OVxuICAgIHQyID0gMTIgKyB0MSAqIHQxXG4gICAgciA9IHJlcyAqIDAuNTcgKiAodDIgKyA2ICogdDEpIC8gKHQyIC0gNiAqIHQxKVxuXG4gICAgeCA9IHNhbXBsZSAtIHIgKiB5NFxuXG4gICAgIyBmb3VyIGNhc2NhZGVkIG9uZS1wb2xlIGZpbHRlcnMgKGJpbGluZWFyIHRyYW5zZm9ybSlcbiAgICB5MSA9ICB4ICogcCArIG9sZHggICogcCAtIGsgKiB5MVxuICAgIHkyID0geTEgKiBwICsgb2xkeTEgKiBwIC0gayAqIHkyXG4gICAgeTMgPSB5MiAqIHAgKyBvbGR5MiAqIHAgLSBrICogeTNcbiAgICB5NCA9IHkzICogcCArIG9sZHkzICogcCAtIGsgKiB5NFxuXG4gICAgIyBjbGlwcGVyIGJhbmQgbGltaXRlZCBzaWdtb2lkXG4gICAgeTQgLT0gKHk0ICogeTQgKiB5NCkgLyA2XG5cbiAgICBvbGR4ID0geFxuICAgIG9sZHkxID0geTFcbiAgICBvbGR5MiA9IHkyXG4gICAgb2xkeTMgPSB5M1xuXG4gICAgeTQiLCJ0YXUgPSBNYXRoLlBJICogMlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgc2luZTogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICBNYXRoLnNpbiB0aW1lICogdGF1ICogZnJlcXVlbmN5XG5cbiAgc3F1YXJlOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIGlmICgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSA+IDAuNSB0aGVuIDEgZWxzZSAtMVxuXG4gIHNhdzogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICAxIC0gMiAqICgoKHRpbWUgJSAoMSAvIGZyZXF1ZW5jeSkpICogZnJlcXVlbmN5KSAlIDEpXG5cbiAgbm9pc2U6IC0+XG4gICAgMiAqIE1hdGgucmFuZG9tKCkgLSAxIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSaW5nQnVmZmVyXG4gIFxuICBjb25zdHJ1Y3RvcjogKEBtYXhMZW5ndGgsIEBUeXBlID0gRmxvYXQzMkFycmF5LCBAbGVuZ3RoKSAtPlxuICAgIEBsZW5ndGggfHw9IEBtYXhMZW5ndGhcbiAgICBAYXJyYXkgPSBuZXcgVHlwZSBAbWF4TGVuZ3RoXG4gICAgQHBvcyA9IDBcblxuICByZXNldDogLT5cbiAgICBAYXJyYXkgPSBuZXcgQFR5cGUgQG1heExlbmd0aFxuICAgIHRoaXNcblxuICByZXNpemU6IChAbGVuZ3RoKSAtPlxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPj0gQGxlbmd0aFxuXG4gIHB1c2g6IChlbCkgLT5cbiAgICBAYXJyYXlbQHBvc10gPSBlbFxuICAgIEBwb3MgKz0gMVxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPT0gQGxlbmd0aFxuICAgIHRoaXNcblxuICBmb3JFYWNoOiAoZm4pIC0+XG4gICAgYHZhciBpLCBsZW47XG4gICAgZm9yIChpID0gdGhpcy5wb3MsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnBvczsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBmbih0aGlzLmFycmF5W2ldLCBpKTtcbiAgICB9YFxuICAgIHRoaXNcblxuICByZWR1Y2U6IChmbiwgbWVtbyA9IDApIC0+XG4gICAgQGZvckVhY2ggKGVsLCBpKSAtPlxuICAgICAgbWVtbyA9IGZuIG1lbW8sIGVsLCBpXG4gICAgbWVtb1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZGVjYXksIGVsYXBzZWQpIC0+XG4gIGlmIGVsYXBzZWQgPiBkZWNheVxuICAgIDBcbiAgZWxzZVxuICAgIDEgLSBlbGFwc2VkIC8gZGVjYXlcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJ1bVNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgIyBrZWVwIG5vdGVzIGluIGEgbWFwIHtrZXk6IG5vdGVEYXRhfSBpbnN0ZWFkIG9mIHRvIGEgcmluZyBidWZmZXJcbiAgIyB0aGlzIGdpdmVzIHVzIG9uZSBtb25waG9uaWMgdm9pY2UgcGVyIGRydW1cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID0gbm90ZXM6IHt9XG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIGluc3RydW1lbnQuZHJ1bXMucmVkdWNlKChtZW1vLCBkcnVtKSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIGRydW0uc2FtcGxlRGF0YT9cblxuICAgICAgbm90ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tkcnVtLmtleV1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuXG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgZHJ1bS5zdGFydCAqIGRydW0uc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIHJldHVybiBtZW1vIGlmIHNhbXBsZXNFbGFwc2VkICsgb2Zmc2V0ID4gZHJ1bS5zYW1wbGVEYXRhLmxlbmd0aFxuXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3IgZHJ1bS5zYW1wbGVEYXRhLCBkcnVtLnRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldFxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnZlbG9wZShkcnVtLnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG4gICAgLCAwKVxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tub3RlLmtleV0gPSB7dGltZSwgaSwgbGVuOiBub3RlLmxlbmd0aCAvIGJwc31cbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5zaW1wbGVFbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUnXG5vc2NpbGxhdG9ycyA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9vc2NpbGxhdG9ycydcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERydW1TeW50aGVzaXplciBleHRlbmRzIEluc3RydW1lbnRcblxuICBtaW5GcmVxID0gNjBcbiAgbWF4RnJlcSA9IDMwMDBcbiAgZnJlcVNjYWxlID0gbWF4RnJlcSAtIG1pbkZyZXFcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgaW4gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bS5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiB7fVxuICAgICAgZmlsdGVyczogKFxuICAgICAgICBoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uMTI3XVxuICAgICAgKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgICAgIHJldHVybiBtZW1vIGlmIGVsYXBzZWQgPiBkcnVtLmRlY2F5XG5cbiAgICAgIGVudiA9IHNpbXBsZUVudmVsb3BlIGRydW0uZGVjYXksIGVsYXBzZWRcbiAgICAgIGZyZXEgPSBtaW5GcmVxICsgZHJ1bS5waXRjaCAqIGZyZXFTY2FsZVxuXG4gICAgICAjIGFwcGx5IHBpdGNoIGJlbmRcbiAgICAgIGlmIGRydW0uYmVuZFxuICAgICAgICBmcmVxID0gKDIgLSBkcnVtLmJlbmQgKyBkcnVtLmJlbmQgKiBlbnYpIC8gMiAqIGZyZXFcblxuICAgICAgIyBhcHBseSBmbVxuICAgICAgaWYgZHJ1bS5mbSA+IDBcbiAgICAgICAgc2lnbmFsID0gb3NjaWxsYXRvcnMuc2luZSBlbGFwc2VkLCBtaW5GcmVxICsgZHJ1bS5mbUZyZXEgKiBmcmVxU2NhbGVcbiAgICAgICAgZnJlcSArPSBkcnVtLmZtICogc2lnbmFsICogc2ltcGxlRW52ZWxvcGUoZHJ1bS5mbURlY2F5ICsgMC4wMSwgZWxhcHNlZClcblxuICAgICAgIyBzdW0gbm9pc2UgYW5kIG9zY2lsbGF0b3JcbiAgICAgIHNhbXBsZSA9IChcbiAgICAgICAgKDEgLSBkcnVtLm5vaXNlKSAqIG9zY2lsbGF0b3JzLnNpbmUoZWxhcHNlZCwgZnJlcSkgK1xuICAgICAgICBkcnVtLm5vaXNlICogb3NjaWxsYXRvcnMubm9pc2UoKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGhpZ2hwYXNzXG4gICAgICBpZiBkcnVtLmhwID4gMFxuICAgICAgICBzYW1wbGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tkcnVtLmtleV0gc2FtcGxlLCBkcnVtLmhwXG5cbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ICogc2FtcGxlXG5cbiAgICAsIDApXG5cblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24pIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbbm90ZS5rZXldID0ge3RpbWUsIGksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG5cbiIsIlJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnN0cnVtZW50XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiBuZXcgUmluZ0J1ZmZlciBpbnN0cnVtZW50Lm1heFBvbHlwaG9ueSwgQXJyYXksIGluc3RydW1lbnQucG9seXBob255XG4gICAgICBub3RlTWFwOiB7fVxuXG4gIEByZWxlYXNlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBkZWxldGUgc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIDBcblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24sIG5vdGVzT2ZmKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuICAgIGluc3RydW1lbnRTdGF0ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXVxuXG4gICAgaWYgaW5zdHJ1bWVudC5wb2x5cGhvbnkgIT0gaW5zdHJ1bWVudFN0YXRlLm5vdGVzLmxlbmd0aFxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVzLnJlc2l6ZSBpbnN0cnVtZW50LnBvbHlwaG9ueVxuXG4gICAgbm90ZXNPbi5mb3JFYWNoICh7a2V5fSkgLT5cbiAgICAgICMgY29uc29sZS5sb2cgJ25vdGUgb24gJyArIGtleVxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVNYXBba2V5XSA9IHt0aW1lLCBpLCBrZXl9XG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucHVzaCBpbnN0cnVtZW50U3RhdGUubm90ZU1hcFtrZXldXG5cbiAgICBub3Rlc09mZi5mb3JFYWNoICh7a2V5fSkgLT5cbiAgICAgICMgY29uc29sZS5sb2cgJ25vdGUgb2ZmICcgKyBrZXlcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3RlTWFwW2tleV0udGltZU9mZiA9IHRpbWVcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTG9vcFNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG4iLCJUcmFjayA9IHJlcXVpcmUgJy4vdHJhY2snXG5cbiMgdGhlcmUgYXJlIHRocmVlIHRpbWUgc2NhbGVzIHRoYXQgd2UgYXJlIGNvbmNlcm5lZCB3aXRoXG4jXG4jIC0gc2FtcGxlIHJhdGVcbiMgcnVucyBhdCA0NDEwMCBoeiwgb25jZSBmb3IgZWFjaCBzYW1wbGUgb2YgYXVkaW8gd2Ugb3V0cHV0LiAgQW55IGNvZGUgcnVubmluZ1xuIyBhdCB0aGlzIHJhdGUgaGFzIGEgaGlnaCBjb3N0LCBzbyBwZXJmb3JtYW5jZSBpcyBpbXBvcnRhbnQgaGVyZVxuI1xuIyAtIHRpY2sgcmF0ZVxuIyBUaWNrcyBydW4gZXZlcnkgbiBzYW1wbGVzLCBkZWZpbmVkIHVzaW5nIHRoZSBjbG9ja1JhdGlvIHZhcmlhYmxlLiAgVGhpc1xuIyBhbGxvd3MgdXMgdG8gZG8gcHJvY2Vzc2luZyB0aGF0IG5lZWRzIHRvIHJ1biBmcmVxdWVudGx5LCBidXQgaXMgdG9vIGV4cGVuc2l2ZVxuIyB0byBydW4gZm9yIGVhY2ggc21hcGxlLiAgRm9yIGV4YW1wbGUsIHRoaXMgaXMgdGhlIHRpbWUgcmVzb2x1dGlvbiBhdCB3aGljaFxuIyB3ZSB0cmlnZ2VyIG5ldyBub3Rlcy5cbiNcbiMgLSBmcmFtZSByYXRlXG4jIFRoZSBmcmFtZSByYXRlIGlzIHRoZSBzcGVlZCBhdCB3aGljaCB3ZSB0cmlnZ2VyIEdVSSB1cGRhdGVzIGZvciB0aGluZ3MgbGlrZVxuIyBsZXZlbCBtZXRlcnMgYW5kIHBsYXliYWNrIHBvc2l0aW9uLiAgd2UgY29udGludWUgdG8gcnVuIGZyYW1lIHVwZGF0ZXMgd2hldGhlclxuIyBvbiBub3QgYXVkaW8gaXMgcGxheWluZ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU29uZ1xuXG4gICMgbnVtYmVyIG9mIHNhbXBsZXMgdG8gcHJvY2VzcyBiZXR3ZWVuIHRpY2tzXG4gIGNsb2NrUmF0aW8gPSA0NDFcblxuICAjIHJhdGUgYXQgd2hpY2ggbGV2ZWwgbWV0ZXJzIGRlY2F5XG4gIG1ldGVyRGVjYXkgPSAwLjA1XG5cbiAgY2xpcCA9IChzYW1wbGUpIC0+XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oMiwgc2FtcGxlICsgMSkpIC0gMVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBsYXN0QmVhdCA9IDBcblxuICAgICMga2VlcCBtdXRhYmxlIHN0YXRlIGZvciBhdWRpbyBwbGF5YmFjayBoZXJlIC0gdGhpcyB3aWxsIHN0b3JlIHRoaW5ncyBsaWtlXG4gICAgIyBmaWx0ZXIgbWVtb3J5IGFuZCBtZXRlciBsZXZlbHMgdGhhdCBuZWVkIHRvIHN0YXkgb3V0c2lkZSB0aGUgbm9ybWFsIGN1cnNvclxuICAgICMgc3RydWN0dXJlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG4gICAgQHN0YXRlID0ge31cblxuICAgICMga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBzb25nIGRvY3VtZW50XG4gICAgQHNvbmcgPSBudWxsXG5cbiAgICAjIGtlZXAgYSBsaXN0IG9mIHVucHJvY2Vzc2VkIG1pZGkgbWVzc2FnZXNcbiAgICBAbWlkaU1lc3NhZ2VzID0gW11cblxuICB1cGRhdGU6IChzdGF0ZSkgLT5cbiAgICBAc29uZyA9IHN0YXRlXG5cbiAgbWlkaTogKG1lc3NhZ2UpIC0+XG4gICAgQG1pZGlNZXNzYWdlcy5wdXNoIG1lc3NhZ2VcblxuICAjIGZpbGwgYSBidWZmZXIgZnVuY3Rpb25cbiAgYnVmZmVyOiAoc2l6ZSwgaW5kZXgsIHNhbXBsZVJhdGUsIGNiKSAtPlxuICAgIGFyciA9IG5ldyBGbG9hdDMyQXJyYXkgc2l6ZVxuXG4gICAgaWYgQHNvbmc/XG4gICAgICBmb3IgaSBpbiBbMC4uLnNpemVdXG4gICAgICAgIGlpID0gaSArIGluZGV4XG4gICAgICAgIHQgPSBpaSAvIHNhbXBsZVJhdGVcbiAgICAgICAgYXJyW2ldID0gQHNhbXBsZSB0LCBpaVxuXG4gICAgIyBjbGVhciBtaWRpIG1lc3NhZ2VzIGFmdGVyIGJ1ZmZlciBpcyBmaWxsZWRcbiAgICBAbWlkaU1lc3NhZ2VzID0gW11cblxuICAgIGNiIGFyci5idWZmZXJcblxuICAjIGNhbGxlZCBmb3IgZXZlcnkgc2FtcGxlIG9mIGF1ZGlvXG4gIHNhbXBsZTogKHRpbWUsIGkpID0+XG4gICAgQHRpY2sgdGltZSwgaSBpZiBpICUgY2xvY2tSYXRpbyBpcyAwXG5cbiAgICBjbGlwIEBzb25nLmxldmVsICogQHNvbmcudHJhY2tzLnJlZHVjZSgobWVtbywgdHJhY2spID0+XG4gICAgICBtZW1vICsgVHJhY2suc2FtcGxlIEBzdGF0ZSwgdHJhY2ssIHRpbWUsIGlcbiAgICAsIDApXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IGNsb2NrUmF0aW8gc2FtcGxlc1xuICB0aWNrOiAodGltZSwgaSkgPT5cbiAgICBicHMgPSBAc29uZy5icG0gLyA2MFxuICAgIGJlYXQgPSB0aW1lICogYnBzXG5cbiAgICBAc29uZy50cmFja3MuZm9yRWFjaCAodHJhY2ssIGkpID0+XG5cbiAgICAgICMgZm9yIG5vdyBzZW5kIG1pZGkgb25seSB0byB0aGUgZmlyc3QgdHJhY2sgLSBpbiB0aGUgZnV0dXJlIHdlIHNob3VsZFxuICAgICAgIyBhbGxvdyB0cmFja3MgdG8gYmUgYXJtZWQgZm9yIHJlY29yZGluZ1xuICAgICAgbWlkaU1lc3NhZ2VzID0gaWYgaSBpcyAwIHRoZW4gQG1pZGlNZXNzYWdlcyBlbHNlIG51bGxcblxuICAgICAgVHJhY2sudGljayBAc3RhdGUsIHRyYWNrLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGksIGJlYXQsIEBsYXN0QmVhdCwgYnBzXG5cbiAgICBAbGFzdEJlYXQgPSBiZWF0XG5cbiAgIyBjYWxsZWQgcGVyaW9kaWNhbGx5IHRvIHBhc3MgaGlnaCBmcmVxdWVuY3kgZGF0YSB0byB0aGUgdWkuLiB0aGlzIHNob3VsZFxuICAjIGV2ZW50dWFsbHkgYmUgdXBkYXRlZCB0byBiYXNlIHRoZSBhbW91bnQgb2YgZGVjYXkgb24gdGhlIGFjdHVhbCBlbHBhc2VkIHRpbWVcbiAgcHJvY2Vzc0ZyYW1lOiAtPlxuICAgIGlmIEBzb25nPy50cmFja3M/XG4gICAgICAjIGFwcGx5IGRlY2F5IHRvIG1ldGVyIGxldmVsc1xuICAgICAgZm9yIHRyYWNrIGluIEBzb25nLnRyYWNrc1xuICAgICAgICBpZiBAc3RhdGVbdHJhY2suX2lkXT9cbiAgICAgICAgICBAc3RhdGVbdHJhY2suX2lkXS5tZXRlckxldmVsIC09IG1ldGVyRGVjYXlcblxuICAjIGdldCBhIHNlbmRhYmxlIHZlcnNpb24gb2YgY3VycmVudCBzb25nIHBsYXliYWNrIHN0YXRlXG4gIGdldFN0YXRlOiAtPlxuICAgIG1ldGVyTGV2ZWxzOiBAc29uZz8udHJhY2tzPy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtb1t0cmFjay5faWRdID0gQHN0YXRlW3RyYWNrLl9pZF0/Lm1ldGVyTGV2ZWxcbiAgICAgIG1lbW9cbiAgICAsIHt9KVxuIiwiaW5zdHJ1bWVudFR5cGVzID1cbiAgQW5hbG9nU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vYW5hbG9nX3N5bnRoZXNpemVyJ1xuICBCYXNpY1NhbXBsZXI6IHJlcXVpcmUgJy4vYmFzaWNfc2FtcGxlcidcbiAgRHJ1bVNhbXBsZXI6IHJlcXVpcmUgJy4vZHJ1bV9zYW1wbGVyJ1xuICBEcnVtU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vZHJ1bV9zeW50aGVzaXplcidcbiAgTG9vcFNhbXBsZXI6IHJlcXVpcmUgJy4vbG9vcF9zYW1wbGVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHJhY2tcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgc3RhdGVbdHJhY2suX2lkXSA9XG4gICAgICBtZXRlckxldmVsOiAwXG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCB0cmFjaykgLT5cbiAgICBkZWxldGUgc3RhdGVbdHJhY2suX2lkXVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGkpIC0+XG4gICAgIyBnZXQgaW5zdHJ1bWVudCBvdXRwdXRcbiAgICBJbnN0cnVtZW50ID0gaW5zdHJ1bWVudFR5cGVzW3RyYWNrLmluc3RydW1lbnQuX3R5cGVdXG4gICAgc2FtcGxlID0gSW5zdHJ1bWVudC5zYW1wbGUgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGlcblxuICAgICMgYXBwbHkgZWZmZWN0c1xuICAgIHNhbXBsZSA9IHRyYWNrLmVmZmVjdHMucmVkdWNlKChzYW1wbGUsIGVmZmVjdCkgLT5cbiAgICAgIEVmZmVjdC5zYW1wbGUgc3RhdGUsIGVmZmVjdCwgdGltZSwgaSwgc2FtcGxlXG4gICAgLCBzYW1wbGUpXG5cbiAgICAjIHVwZGF0ZSBtZXRlciBsZXZlbHNcbiAgICBpZiB0cmFja1N0YXRlID0gc3RhdGVbdHJhY2suX2lkXVxuICAgICAgbGV2ZWwgPSB0cmFja1N0YXRlLm1ldGVyTGV2ZWxcbiAgICAgIGlmIG5vdCBsZXZlbD8gb3IgaXNOYU4obGV2ZWwpIG9yIHNhbXBsZSA+IGxldmVsXG4gICAgICAgIHRyYWNrU3RhdGUubWV0ZXJMZXZlbCA9IHNhbXBsZVxuXG4gICAgc2FtcGxlXG5cbiAgQHRpY2s6IChzdGF0ZSwgdHJhY2ssIG1pZGlNZXNzYWdlcywgdGltZSwgaSwgYmVhdCwgbGFzdEJlYXQsIGJwcykgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIHRyYWNrIHVubGVzcyBzdGF0ZVt0cmFjay5faWRdP1xuXG4gICAgSW5zdHJ1bWVudCA9IGluc3RydW1lbnRUeXBlc1t0cmFjay5pbnN0cnVtZW50Ll90eXBlXVxuXG4gICAgIyBnZXQgbm90ZXMgb24gZnJvbSBzZXF1ZW5jZVxuICAgIHtub3Rlc09uLCBub3Rlc09mZn0gPSBAbm90ZXMgdHJhY2suc2VxdWVuY2UsIG1pZGlNZXNzYWdlcywgdGltZSwgYmVhdCwgbGFzdEJlYXRcblxuICAgIEluc3RydW1lbnQudGljayBzdGF0ZSwgdHJhY2suaW5zdHJ1bWVudCwgdGltZSwgaSwgYmVhdCwgYnBzLCBub3Rlc09uLCBub3Rlc09mZlxuICAgIHRyYWNrLmVmZmVjdHMuZm9yRWFjaCAoZSkgLT4gZS50aWNrIHN0YXRlLCB0aW1lLCBiZWF0LCBicHNcblxuICAjIGxvb2sgYXQgc2VxdWVuY2UgYW5kIG1pZGkgbWVzc2FnZXMsIHJldHVybiBhcnJheXMgb2Ygbm90ZXMgb24gYW5kIG9mZlxuICAjIG9jY3VycmluZyBpbiB0aGlzIHRpY2tcbiAgQG5vdGVzOiAoc2VxdWVuY2UsIG1pZGlNZXNzYWdlcywgdGltZSwgYmVhdCwgbGFzdEJlYXQpIC0+XG4gICAgYmFyID0gTWF0aC5mbG9vciBiZWF0IC8gc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmFyID0gTWF0aC5mbG9vciBsYXN0QmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgYmVhdCA9IGJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGxhc3RCZWF0ID0gbGFzdEJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuXG4gICAgbm90ZXNPbiA9IFtdXG4gICAgbm90ZXNPZmYgPSBbXVxuXG4gICAgZm9yIGlkLCBub3RlIG9mIHNlcXVlbmNlLm5vdGVzXG4gICAgICBzdGFydCA9IG5vdGUuc3RhcnRcbiAgICAgIGVuZCA9IG5vdGUuc3RhcnQgKyBub3RlLmxlbmd0aFxuICAgICAgaWYgc3RhcnQgPCBiZWF0IGFuZCAoc3RhcnQgPj0gbGFzdEJlYXQgb3IgYmFyID4gbGFzdEJhcilcbiAgICAgICAgbm90ZXNPbi5wdXNoIHtrZXk6IG5vdGUua2V5fVxuICAgICAgaWYgZW5kIDwgYmVhdCBhbmQgKGVuZCA+PSBsYXN0QmVhdCBvciBiYXIgPiBsYXN0QmFyKVxuICAgICAgICBub3Rlc09mZi5wdXNoIHtrZXk6IG5vdGUua2V5fVxuXG4gICAgaWYgbWlkaU1lc3NhZ2VzP1xuICAgICAgbWlkaU1lc3NhZ2VzLmZvckVhY2ggKG1lc3NhZ2UsIGkpIC0+XG4gICAgICAgIGlmIG1lc3NhZ2UudGltZSA8IHRpbWVcbiAgICAgICAgICBtaWRpTWVzc2FnZXMuc3BsaWNlIGksIDFcbiAgICAgICAgICBzd2l0Y2ggbWVzc2FnZS50eXBlXG4gICAgICAgICAgICB3aGVuICdvbidcbiAgICAgICAgICAgICAgbm90ZXNPbi5wdXNoIGtleTogbWVzc2FnZS5rZXlcbiAgICAgICAgICAgIHdoZW4gJ29mZidcbiAgICAgICAgICAgICAgbm90ZXNPZmYucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG5cbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9XG4iXX0=
