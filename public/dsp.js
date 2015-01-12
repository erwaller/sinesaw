(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Song, song;

Song = require('./dsp/song.coffee');

song = new Song;

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



},{"./dsp/song.coffee":15}],2:[function(require,module,exports){
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



},{"./components/envelope":4,"./components/highpass_filter":5,"./components/lowpass_filter":7,"./components/oscillators":8,"./components/ring_buffer":9,"./instrument":13}],3:[function(require,module,exports){
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



},{"./components/envelope":4,"./components/highpass_filter":5,"./components/linear_interpolator":6,"./components/lowpass_filter":7,"./components/ring_buffer":9,"./instrument":13}],4:[function(require,module,exports){
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



},{}],8:[function(require,module,exports){
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



},{}],9:[function(require,module,exports){
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



},{}],10:[function(require,module,exports){
module.exports = function(decay, elapsed) {
  if (elapsed > decay) {
    return 0;
  } else {
    return 1 - elapsed / decay;
  }
};



},{}],11:[function(require,module,exports){
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



},{"./components/envelope":4,"./components/linear_interpolator":6,"./instrument":13}],12:[function(require,module,exports){
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



},{"./components/highpass_filter":5,"./components/oscillators":8,"./components/simple_envelope":10,"./instrument":13}],13:[function(require,module,exports){
var Instrument, RingBuffer;

RingBuffer = require('./components/ring_buffer');

module.exports = Instrument = (function() {
  function Instrument() {}

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

  Instrument.tick = function(state, instrument, time, i, beat, bps, notesOn, notesOff) {
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

})();



},{"./components/ring_buffer":9}],14:[function(require,module,exports){
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



},{"./components/ring_buffer":9,"./instrument":13}],15:[function(require,module,exports){
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
    cb(arr.buffer);
    return this.midiMessages = [];
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
        var midi;
        midi = i === 0 ? _this.midi : null;
        return Track.tick(_this.state, track, midi, time, i, beat, _this.lastBeat, bps);
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



},{"./track":16}],16:[function(require,module,exports){
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
    _ref = this.notes(track.sequence, midiMessages, beat, lastBeat), notesOn = _ref.notesOn, notesOff = _ref.notesOff;
    Instrument.tick(state, track.instrument, midi, time, i, beat, bps, notesOn, notesOff);
    return track.effects.forEach(function(e) {
      return e.tick(state, time, beat, bps);
    });
  };

  Track.notes = function(sequence, midiMessages, beat, lastBeat) {
    var bar, end, id, lastBar, message, note, notesOff, notesOn, start, time, _i, _len, _ref;
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
      if (end < beat && (end >= lastBeat || bar > lastbar)) {
        notesOff.push({
          key: note.key
        });
      }
    }
    for (_i = 0, _len = midiMessages.length; _i < _len; _i++) {
      message = midiMessages[_i];
      time = message.time;
      if (time < beat && (time >= lastBeat || bar > lastBar)) {
        switch (message.type) {
          case 'on':
            notesOn.push({
              key: message.key
            });
            break;
          case 'off':
            notesOff.push({
              key: message.key
            });
        }
      }
    }
    return {
      notesOn: notesOn,
      notesOff: notesOff
    };
  };

  return Track;

})();



},{"./analog_synthesizer":2,"./basic_sampler":3,"./drum_sampler":11,"./drum_synthesizer":12,"./loop_sampler":14}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9vc2NpbGxhdG9ycy5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9yaW5nX2J1ZmZlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2RydW1fc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvaW5zdHJ1bWVudC5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvbG9vcF9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9zb25nLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC90cmFjay5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNZQSxJQUFBLFVBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxtQkFBUixDQUFQLENBQUE7O0FBQUEsSUFFQSxHQUFPLEdBQUEsQ0FBQSxJQUZQLENBQUE7O0FBQUEsSUFLSSxDQUFDLFNBQUwsR0FBaUIsU0FBQyxDQUFELEdBQUE7QUFDZixVQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBZDtBQUFBLFNBQ08sUUFEUDthQUVJLElBQUksQ0FBQyxNQUFMLENBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFuQixFQUZKO0FBQUEsU0FHTyxNQUhQO2FBSUksSUFBSSxDQUFDLElBQUwsQ0FBVSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQWpCLEVBSko7QUFBQSxTQUtPLFFBTFA7YUFNSSxJQUFJLENBQUMsTUFBTCxDQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBbkIsRUFBeUIs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LENBQUMsSUFBUixDQUFhO0FBQUEsVUFBQyxHQUFBLEVBQUssSUFBSSxDQUFDLEdBQVg7U0FBYixDQUFBLENBREY7T0FGQTtBQUlBLE1BQUEsSUFBRyxHQUFBLEdBQU0sSUFBTixJQUFlLENBQUMsR0FBQSxJQUFPLFFBQVAsSUFBbUIsR0FBQSxHQUFNLE9BQTFCLENBQWxCO0FBQ0UsUUFBQSxRQUFRLENBQUMsSUFBVCxDQUFjO0FBQUEsVUFBQyxHQUFBLEVBQUssSUFBSSxDQUFDLEdBQVg7U0FBZCxDQUFBLENBREY7T0FMRjtBQUFBLEtBUkE7QUFnQkEsU0FBQSxtREFBQTtpQ0FBQTtBQUNFLE1BQUEsSUFBQSxHQUFPLE9BQU8sQ0FBQyxJQUFmLENBQUE7QUFDQSxNQUFBLElBQUcsSUFBQSxHQUFPLElBQVAsSUFBZ0IsQ0FBQyxJQUFBLElBQVEsUUFBUixJQUFvQixHQUFBLEdBQU0sT0FBM0IsQ0FBbkI7QUFDRSxnQkFBTyxPQUFPLENBQUMsSUFBZjtBQUFBLGVBQ08sSUFEUDtBQUVJLFlBQUEsT0FBTyxDQUFDLElBQVIsQ0FBYTtBQUFBLGNBQUEsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUFiO2FBQWIsQ0FBQSxDQUZKO0FBQ087QUFEUCxlQUdPLEtBSFA7QUFJSSxZQUFBLFFBQVEsQ0FBQyxJQUFULENBQWM7QUFBQSxjQUFBLEdBQUEsRUFBSyxPQUFPLENBQUMsR0FBYjthQUFkLENBQUEsQ0FKSjtBQUFBLFNBREY7T0FGRjtBQUFBLEtBaEJBO1dBeUJBO0FBQUEsTUFBQyxTQUFBLE9BQUQ7QUFBQSxNQUFVLFVBQUEsUUFBVjtNQTFCTTtFQUFBLENBdENSLENBQUE7O2VBQUE7O0lBVkYsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIHRoaXMgc2NyaXB0IGlzIHJ1biBpbnNpZGUgYSB3b3JrZXIgaW4gb3JkZXIgdG8gZG8gYXVkaW8gcHJvY2Vzc2luZyBvdXRzaWRlIG9mXG4jIHRoZSBtYWluIHVpIHRocmVhZC5cbiNcbiMgVGhlIHdvcmtlciByZWNlaXZlcyB0aHJlZSB0eXBlcyBvZiBtZXNzYWdlcyAtICd1cGRhdGUnIHcvIHtzdGF0ZX0gY29udGFpbmluZ1xuIyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc29uZywgJ21pZGknIHcvIHtzdGF0ZX0gY29udGFpbmluZyB0aGUgYW5kIGN1cnJlbnRcbiMgc3RhdGUgb2YgdGhlIG1pZGkgaW5wdXQsIGFuZCAnYnVmZmVyJyB3LyB7c2l6ZSwgaW5kZXgsIHNhbXBsZVJhdGV9IHJlcXVlc3RpbmdcbiMgYSBidWZmZXIgdG8gYmUgZmlsbGVkIGFuZCBzZW50IGJhY2suXG4jXG4jIEl0IGFsc28gc2VuZHMgdHdvIHR5cGVzIG9mIG1lc3NhZ2VzIC0gJ2ZyYW1lJyBtZXNzYWdlcyBhdCA2MGh6IGNvbnRhaW5pbmcgdGhlXG4jIGN1cnJlbnQgcGxheWJhY2sgc3RhdGUgYXMge2ZyYW1lfSwgYW5kIHNlbmRzICdidWZmZXInIG1lc3NhZ2VzIHRyYW5zZmVycmluZ1xuIyBmaWxsZWQgQXJyYXlCdWZmZXJzIGluIHJlc3BvbnNlIHRvICdidWZmZXInIHJlcXVlc3RzLlxuXG5Tb25nID0gcmVxdWlyZSAnLi9kc3Avc29uZy5jb2ZmZWUnXG5cbnNvbmcgPSBuZXcgU29uZ1xuXG4jIHJlc3BvbmQgdG8gbWVzc2FnZXMgZnJvbSBwYXJlbnQgdGhyZWFkXG5zZWxmLm9ubWVzc2FnZSA9IChlKSAtPlxuICBzd2l0Y2ggZS5kYXRhLnR5cGVcbiAgICB3aGVuICd1cGRhdGUnXG4gICAgICBzb25nLnVwZGF0ZSBlLmRhdGEuc3RhdGVcbiAgICB3aGVuICdtaWRpJ1xuICAgICAgc29uZy5taWRpIGUuZGF0YS5tZXNzYWdlXG4gICAgd2hlbiAnYnVmZmVyJ1xuICAgICAgc29uZy5idWZmZXIgZS5kYXRhLnNpemUsIGUuZGF0YS5pbmRleCwgZS5kYXRhLnNhbXBsZVJhdGUsIChidWZmZXIpIC0+XG4gICAgICAgIHBvc3RNZXNzYWdlXG4gICAgICAgICAgdHlwZTogJ2J1ZmZlcidcbiAgICAgICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgICAsIFtidWZmZXJdXG5cbiMgdHJpZ2dlciBwcm9jZXNzaW5nIG9uIHNvbmcgYXQgZnJhbWUgcmF0ZSBhbmQgc2VuZCB1cGRhdGVzIHRvIHRoZSBwYXJlbnQgdGhyZWFkXG5zZXRJbnRlcnZhbCAtPlxuICBzb25nLnByb2Nlc3NGcmFtZSgpXG4gIHBvc3RNZXNzYWdlXG4gICAgdHlwZTogJ2ZyYW1lJ1xuICAgIGZyYW1lOiBzb25nLmdldFN0YXRlKClcbiwgMTAwMCAvIDYwXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxvd3Bhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbG93cGFzc19maWx0ZXInXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQW5hbG9nU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgdHVuZSA9IDQ0MFxuICBmcmVxdWVuY3kgPSAoa2V5KSAtPlxuICAgIHR1bmUgKiBNYXRoLnBvdyAyLCAoa2V5IC0gNjkpIC8gMTJcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdXBlciBzdGF0ZSwgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgciA9IE1hdGgubWF4IDAuMDEsIGluc3RydW1lbnQudm9sdW1lRW52LnJcbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlLmxlbiArIHIgPiB0aW1lIC0gbm90ZS50aW1lXG5cbiAgICAgICMgc3VtIG9zY2lsbGF0b3JzIGFuZCBhcHBseSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIG9zYzFGcmVxID0gZnJlcXVlbmN5IG5vdGUua2V5ICsgaW5zdHJ1bWVudC5vc2MxLnR1bmUgLSAwLjUgKyBNYXRoLnJvdW5kKDI0ICogKGluc3RydW1lbnQub3NjMS5waXRjaCAtIDAuNSkpXG4gICAgICBvc2MyRnJlcSA9IGZyZXF1ZW5jeSBub3RlLmtleSArIGluc3RydW1lbnQub3NjMi50dW5lIC0gMC41ICsgTWF0aC5yb3VuZCgyNCAqIChpbnN0cnVtZW50Lm9zYzIucGl0Y2ggLSAwLjUpKVxuICAgICAgc2FtcGxlID0gZW52ZWxvcGUoaW5zdHJ1bWVudC52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKFxuICAgICAgICBpbnN0cnVtZW50Lm9zYzEubGV2ZWwgKiBvc2NpbGxhdG9yc1tpbnN0cnVtZW50Lm9zYzEud2F2ZWZvcm1dKHRpbWUsIG9zYzFGcmVxKSArXG4gICAgICAgIGluc3RydW1lbnQub3NjMi5sZXZlbCAqIG9zY2lsbGF0b3JzW2luc3RydW1lbnQub3NjMi53YXZlZm9ybV0odGltZSwgb3NjMkZyZXEpXG4gICAgICApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xubG93cGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlcidcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQmFzaWNTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIEBkZWZhdWx0czpcbiAgICBfdHlwZTogJ0Jhc2ljU2FtcGxlcidcbiAgICBsZXZlbDogMC41XG4gICAgcGFuOiAwLjVcbiAgICBwb2x5cGhvbnk6IDFcbiAgICBtYXhQb2x5cGhvbnk6IDZcbiAgICByb290S2V5OiA2MFxuICAgIHNhbXBsZURhdGE6IG51bGxcbiAgICBzYW1wbGVOYW1lOiAnJ1xuICAgIHN0YXJ0OiAwLjNcbiAgICBsb29wQWN0aXZlOiAnbG9vcCdcbiAgICBsb29wOiAwLjdcbiAgICB0dW5lOiAwLjVcbiAgICB2b2x1bWVFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXJFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXI6XG4gICAgICB0eXBlOiAnbm9uZSdcbiAgICAgIGZyZXE6IDAuMjdcbiAgICAgIHJlczogMC4wNVxuICAgICAgZW52OiAwLjQ1XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3VwZXIgc3RhdGUsIGluc3RydW1lbnRcblxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzID1cbiAgICAgIExQOiAobG93cGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgSFA6IChoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgbm9uZTogKCgoc2FtcGxlKSAtPiBzYW1wbGUpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuICAgIHJldHVybiAwIHVubGVzcyBpbnN0cnVtZW50LnNhbXBsZURhdGE/XG5cbiAgICByID0gTWF0aC5tYXggMC4wMSwgaW5zdHJ1bWVudC52b2x1bWVFbnYuclxuXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlcy5yZWR1Y2UoKG1lbW8sIG5vdGUsIGluZGV4KSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZS5sZW4gKyByID4gdGltZSAtIG5vdGUudGltZVxuXG4gICAgICAjIGdldCBwaXRjaCBzaGlmdGVkIGludGVycG9sYXRlZCBzYW1wbGUgYW5kIGFwcGx5IHZvbHVtZSBlbnZlbG9wZVxuICAgICAgdHJhbnNwb3NlID0gbm90ZS5rZXkgLSBpbnN0cnVtZW50LnJvb3RLZXkgKyBpbnN0cnVtZW50LnR1bmUgLSAwLjVcbiAgICAgIHNhbXBsZXNFbGFwc2VkID0gaSAtIG5vdGUuaVxuICAgICAgb2Zmc2V0ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50LnN0YXJ0ICogaW5zdHJ1bWVudC5zYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgbG9vcFBvaW50ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50Lmxvb3AgKiBpbnN0cnVtZW50LnNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3IgaW5zdHJ1bWVudC5zYW1wbGVEYXRhLCB0cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXQsIGluc3RydW1lbnQubG9vcEFjdGl2ZSA9PSAnbG9vcCcsIGxvb3BQb2ludFxuICAgICAgc2FtcGxlID0gZW52ZWxvcGUoaW5zdHJ1bWVudC52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKHNhbXBsZSBvciAwKVxuXG4gICAgICAjIGFwcGx5IGZpbHRlciB3aXRoIGVudmVsb3BlXG4gICAgICBjdXRvZmYgPSBNYXRoLm1pbiAxLCBpbnN0cnVtZW50LmZpbHRlci5mcmVxICsgaW5zdHJ1bWVudC5maWx0ZXIuZW52ICogZW52ZWxvcGUoaW5zdHJ1bWVudC5maWx0ZXJFbnYsIG5vdGUsIHRpbWUpXG4gICAgICBmaWx0ZXIgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tpbnN0cnVtZW50LmZpbHRlci50eXBlXVtpbmRleF1cbiAgICAgIHNhbXBsZSA9IGZpbHRlciBzYW1wbGUsIGN1dG9mZiwgaW5zdHJ1bWVudC5maWx0ZXIucmVzXG5cbiAgICAgICMgcmV0dXJuIHJlc3VsdFxuICAgICAgbWVtbyArIHNhbXBsZVxuXG4gICAgLCAwKVxuIiwibWluRW52VmFsdWUgPSAwLjAxXG5cbm1vZHVsZS5leHBvcnRzID0gKGVudiwgbm90ZSwgdGltZSkgLT5cblxuICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICBhID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5hXG4gIGQgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmRcbiAgcyA9IGVudi5zXG4gIHIgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LnJcblxuICAjIGF0dGFjaywgZGVjYXksIHN1c3RhaW5cbiAgbCA9IGlmIGVsYXBzZWQgPiBhICsgZFxuICAgIGwgPSBzXG4gIGVsc2UgaWYgZWxhcHNlZCA+IGFcbiAgICBsID0gcyArICgxIC0gcykgKiAoYSArIGQgLSBlbGFwc2VkKSAvIGRcbiAgZWxzZVxuICAgIGVsYXBzZWQgLyBhXG5cbiAgIyByZWxlYXNlXG4gIGlmIGVsYXBzZWQgPiBub3RlLmxlblxuICAgIGwgPSBsICogKHIgKyBub3RlLmxlbiAtIGVsYXBzZWQpIC8gclxuXG4gIE1hdGgubWF4IDAsIGxcbiIsInNhbXBsZVJhdGUgPSA0ODAwMFxubWF4RnJlcSA9IDEyMDAwXG5kYkdhaW4gPSAxMiAgICAjIGdhaW4gb2YgZmlsdGVyXG5iYW5kd2lkdGggPSAxICAjIGJhbmR3aWR0aCBpbiBvY3RhdmVzXG5cbiMgY29uc3RhbnRzXG5BID0gTWF0aC5wb3coMTAsIGRiR2FpbiAvIDQwKVxuZSA9IE1hdGgubG9nKDIpXG50YXUgPSAyICogTWF0aC5QSVxuYmV0YSA9IE1hdGguc3FydCgyICogQSlcblxuIyBoeXBlcmJvbGljIHNpbiBmdW5jdGlvblxuc2luaCA9ICh4KSAtPlxuICB5ID0gTWF0aC5leHAgeFxuICAoeSAtIDEgLyB5KSAvIDJcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBhMCA9IGExID0gYTIgPSBhMyA9IGE0ID0geDEgPSB4MiA9IHkxID0geTIgPSAwXG4gIGZyZXEgPSBvbWVnYSA9IHNuID0gYWxwaGEgPSAwXG4gIGNzID0gMVxuXG4gIGxhc3RDdXRvZmYgPSAwXG5cbiAgKHNhbXBsZSwgY3V0b2ZmKSAtPlxuICAgICMgY2FjaGUgZmlsdGVyIHZhbHVlcyB1bnRpbCBjdXRvZmYgY2hhbmdlc1xuICAgIGlmIGN1dG9mZiAhPSBsYXN0Q3V0b2ZmXG4gIFxuICAgICAgb2xkQ3V0b2ZmID0gY3V0b2ZmXG5cbiAgICAgIGZyZXEgPSBjdXRvZmYgKiBtYXhGcmVxXG4gICAgICBvbWVnYSA9IHRhdSAqIGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgICBzbiA9IE1hdGguc2luIG9tZWdhXG4gICAgICBjcyA9IE1hdGguY29zIG9tZWdhXG4gICAgICBhbHBoYSA9IHNuICogc2luaChlIC8gMiAqIGJhbmR3aWR0aCAqIG9tZWdhIC8gc24pXG5cbiAgICAgIGIwID0gKDEgKyBjcykgLyAyXG4gICAgICBiMSA9IC0oMSArIGNzKVxuICAgICAgYjIgPSAoMSArIGNzKSAvIDJcbiAgICAgIGFhMCA9IDEgKyBhbHBoYVxuICAgICAgYWExID0gLTIgKiBjc1xuICAgICAgYWEyID0gMSAtIGFscGhhXG5cbiAgICAgIGEwID0gYjAgLyBhYTBcbiAgICAgIGExID0gYjEgLyBhYTBcbiAgICAgIGEyID0gYjIgLyBhYTBcbiAgICAgIGEzID0gYWExIC8gYWEwXG4gICAgICBhNCA9IGFhMiAvIGFhMFxuXG4gICAgIyBjb21wdXRlIHJlc3VsdFxuICAgIHMgPSBNYXRoLm1heCAtMSwgTWF0aC5taW4gMSwgc2FtcGxlXG4gICAgcmVzdWx0ID0gYTAgKiBzICsgYTEgKiB4MSArIGEyICogeDIgLSBhMyAqIHkxIC0gYTQgKiB5MlxuXG4gICAgIyBzaGlmdCB4MSB0byB4Miwgc2FtcGxlIHRvIHgxXG4gICAgeDIgPSB4MVxuICAgIHgxID0gc1xuXG4gICAgIyBzaGlmdCB5MSB0byB5MiwgcmVzdWx0IHRvIHkxXG4gICAgeTIgPSB5MVxuICAgIHkxID0gcmVzdWx0XG5cbiAgICByZXN1bHQiLCJtb2R1bGUuZXhwb3J0cyA9IChzYW1wbGVEYXRhLCB0cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXQgPSAwLCBsb29wQWN0aXZlID0gZmFsc2UsIGxvb3BQb2ludCkgLT5cbiAgaSA9IHNhbXBsZXNFbGFwc2VkICogTWF0aC5wb3cgMiwgdHJhbnNwb3NlIC8gMTJcbiAgaTEgPSBNYXRoLmZsb29yIGlcbiAgaTEgPSBpMSAlIChsb29wUG9pbnQgLSBvZmZzZXQpIGlmIGxvb3BBY3RpdmVcbiAgaTIgPSBpMSArIDFcbiAgbCA9IGkgJSAxXG5cbiAgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMV0gKiAoMSAtIGwpICsgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMl0gKiBsIiwic2FtcGxlUmF0ZSA9IDQ4MDAwXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cblxuICB5MSA9IHkyID0geTMgPSB5NCA9IG9sZHggPSBvbGR5MSA9IG9sZHkyID0gb2xkeTMgPSAwXG4gIHAgPSBrID0gdDEgPSB0MiA9IHIgPSB4ID0gbnVsbFxuXG4gIChzYW1wbGUsIGN1dG9mZiwgcmVzKSAtPlxuICAgIGZyZXEgPSAyMCAqIE1hdGgucG93IDEwLCAzICogY3V0b2ZmXG4gICAgZnJlcSA9IGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgcCA9IGZyZXEgKiAoMS44IC0gKDAuOCAqIGZyZXEpKVxuICAgIGsgPSAyICogTWF0aC5zaW4oZnJlcSAqIE1hdGguUEkgLyAyKSAtIDFcbiAgICB0MSA9ICgxIC0gcCkgKiAxLjM4NjI0OVxuICAgIHQyID0gMTIgKyB0MSAqIHQxXG4gICAgciA9IHJlcyAqIDAuNTcgKiAodDIgKyA2ICogdDEpIC8gKHQyIC0gNiAqIHQxKVxuXG4gICAgeCA9IHNhbXBsZSAtIHIgKiB5NFxuXG4gICAgIyBmb3VyIGNhc2NhZGVkIG9uZS1wb2xlIGZpbHRlcnMgKGJpbGluZWFyIHRyYW5zZm9ybSlcbiAgICB5MSA9ICB4ICogcCArIG9sZHggICogcCAtIGsgKiB5MVxuICAgIHkyID0geTEgKiBwICsgb2xkeTEgKiBwIC0gayAqIHkyXG4gICAgeTMgPSB5MiAqIHAgKyBvbGR5MiAqIHAgLSBrICogeTNcbiAgICB5NCA9IHkzICogcCArIG9sZHkzICogcCAtIGsgKiB5NFxuXG4gICAgIyBjbGlwcGVyIGJhbmQgbGltaXRlZCBzaWdtb2lkXG4gICAgeTQgLT0gKHk0ICogeTQgKiB5NCkgLyA2XG5cbiAgICBvbGR4ID0geFxuICAgIG9sZHkxID0geTFcbiAgICBvbGR5MiA9IHkyXG4gICAgb2xkeTMgPSB5M1xuXG4gICAgeTQiLCJ0YXUgPSBNYXRoLlBJICogMlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgc2luZTogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICBNYXRoLnNpbiB0aW1lICogdGF1ICogZnJlcXVlbmN5XG5cbiAgc3F1YXJlOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIGlmICgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSA+IDAuNSB0aGVuIDEgZWxzZSAtMVxuXG4gIHNhdzogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICAxIC0gMiAqICgoKHRpbWUgJSAoMSAvIGZyZXF1ZW5jeSkpICogZnJlcXVlbmN5KSAlIDEpXG5cbiAgbm9pc2U6IC0+XG4gICAgMiAqIE1hdGgucmFuZG9tKCkgLSAxIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSaW5nQnVmZmVyXG4gIFxuICBjb25zdHJ1Y3RvcjogKEBtYXhMZW5ndGgsIEBUeXBlID0gRmxvYXQzMkFycmF5LCBAbGVuZ3RoKSAtPlxuICAgIEBsZW5ndGggfHw9IEBtYXhMZW5ndGhcbiAgICBAYXJyYXkgPSBuZXcgVHlwZSBAbWF4TGVuZ3RoXG4gICAgQHBvcyA9IDBcblxuICByZXNldDogLT5cbiAgICBAYXJyYXkgPSBuZXcgQFR5cGUgQG1heExlbmd0aFxuICAgIHRoaXNcblxuICByZXNpemU6IChAbGVuZ3RoKSAtPlxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPj0gQGxlbmd0aFxuXG4gIHB1c2g6IChlbCkgLT5cbiAgICBAYXJyYXlbQHBvc10gPSBlbFxuICAgIEBwb3MgKz0gMVxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPT0gQGxlbmd0aFxuICAgIHRoaXNcblxuICBmb3JFYWNoOiAoZm4pIC0+XG4gICAgYHZhciBpLCBsZW47XG4gICAgZm9yIChpID0gdGhpcy5wb3MsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnBvczsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBmbih0aGlzLmFycmF5W2ldLCBpKTtcbiAgICB9YFxuICAgIHRoaXNcblxuICByZWR1Y2U6IChmbiwgbWVtbyA9IDApIC0+XG4gICAgQGZvckVhY2ggKGVsLCBpKSAtPlxuICAgICAgbWVtbyA9IGZuIG1lbW8sIGVsLCBpXG4gICAgbWVtb1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZGVjYXksIGVsYXBzZWQpIC0+XG4gIGlmIGVsYXBzZWQgPiBkZWNheVxuICAgIDBcbiAgZWxzZVxuICAgIDEgLSBlbGFwc2VkIC8gZGVjYXlcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJ1bVNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgIyBrZWVwIG5vdGVzIGluIGEgbWFwIHtrZXk6IG5vdGVEYXRhfSBpbnN0ZWFkIG9mIHRvIGEgcmluZyBidWZmZXJcbiAgIyB0aGlzIGdpdmVzIHVzIG9uZSBtb25waG9uaWMgdm9pY2UgcGVyIGRydW1cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID0gbm90ZXM6IHt9XG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIGluc3RydW1lbnQuZHJ1bXMucmVkdWNlKChtZW1vLCBkcnVtKSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIGRydW0uc2FtcGxlRGF0YT9cblxuICAgICAgbm90ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tkcnVtLmtleV1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuXG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgZHJ1bS5zdGFydCAqIGRydW0uc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIHJldHVybiBtZW1vIGlmIHNhbXBsZXNFbGFwc2VkICsgb2Zmc2V0ID4gZHJ1bS5zYW1wbGVEYXRhLmxlbmd0aFxuXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3IgZHJ1bS5zYW1wbGVEYXRhLCBkcnVtLnRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldFxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnZlbG9wZShkcnVtLnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG4gICAgLCAwKVxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tub3RlLmtleV0gPSB7dGltZSwgaSwgbGVuOiBub3RlLmxlbmd0aCAvIGJwc31cbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5zaW1wbGVFbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUnXG5vc2NpbGxhdG9ycyA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9vc2NpbGxhdG9ycydcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERydW1TeW50aGVzaXplciBleHRlbmRzIEluc3RydW1lbnRcblxuICBtaW5GcmVxID0gNjBcbiAgbWF4RnJlcSA9IDMwMDBcbiAgZnJlcVNjYWxlID0gbWF4RnJlcSAtIG1pbkZyZXFcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgaW4gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bS5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiB7fVxuICAgICAgZmlsdGVyczogKFxuICAgICAgICBoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uMTI3XVxuICAgICAgKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgICAgIHJldHVybiBtZW1vIGlmIGVsYXBzZWQgPiBkcnVtLmRlY2F5XG5cbiAgICAgIGVudiA9IHNpbXBsZUVudmVsb3BlIGRydW0uZGVjYXksIGVsYXBzZWRcbiAgICAgIGZyZXEgPSBtaW5GcmVxICsgZHJ1bS5waXRjaCAqIGZyZXFTY2FsZVxuXG4gICAgICAjIGFwcGx5IHBpdGNoIGJlbmRcbiAgICAgIGlmIGRydW0uYmVuZFxuICAgICAgICBmcmVxID0gKDIgLSBkcnVtLmJlbmQgKyBkcnVtLmJlbmQgKiBlbnYpIC8gMiAqIGZyZXFcblxuICAgICAgIyBhcHBseSBmbVxuICAgICAgaWYgZHJ1bS5mbSA+IDBcbiAgICAgICAgc2lnbmFsID0gb3NjaWxsYXRvcnMuc2luZSBlbGFwc2VkLCBtaW5GcmVxICsgZHJ1bS5mbUZyZXEgKiBmcmVxU2NhbGVcbiAgICAgICAgZnJlcSArPSBkcnVtLmZtICogc2lnbmFsICogc2ltcGxlRW52ZWxvcGUoZHJ1bS5mbURlY2F5ICsgMC4wMSwgZWxhcHNlZClcblxuICAgICAgIyBzdW0gbm9pc2UgYW5kIG9zY2lsbGF0b3JcbiAgICAgIHNhbXBsZSA9IChcbiAgICAgICAgKDEgLSBkcnVtLm5vaXNlKSAqIG9zY2lsbGF0b3JzLnNpbmUoZWxhcHNlZCwgZnJlcSkgK1xuICAgICAgICBkcnVtLm5vaXNlICogb3NjaWxsYXRvcnMubm9pc2UoKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGhpZ2hwYXNzXG4gICAgICBpZiBkcnVtLmhwID4gMFxuICAgICAgICBzYW1wbGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tkcnVtLmtleV0gc2FtcGxlLCBkcnVtLmhwXG5cbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ICogc2FtcGxlXG5cbiAgICAsIDApXG5cblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24pIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbbm90ZS5rZXldID0ge3RpbWUsIGksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG5cbiIsIlJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnN0cnVtZW50XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiBuZXcgUmluZ0J1ZmZlciBpbnN0cnVtZW50Lm1heFBvbHlwaG9ueSwgQXJyYXksIGluc3RydW1lbnQucG9seXBob255XG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIGRlbGV0ZSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF1cblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgMFxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmYpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG4gICAgaW5zdHJ1bWVudFN0YXRlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgICBpZiBpbnN0cnVtZW50LnBvbHlwaG9ueSAhPSBpbnN0cnVtZW50U3RhdGUubm90ZXMubGVuZ3RoXG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucmVzaXplIGluc3RydW1lbnQucG9seXBob255XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucHVzaChcbiAgICAgICAge3RpbWUsIGksIGtleTogbm90ZS5rZXksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG4gICAgICApXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvb3BTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuIiwiVHJhY2sgPSByZXF1aXJlICcuL3RyYWNrJ1xuXG4jIHRoZXJlIGFyZSB0aHJlZSB0aW1lIHNjYWxlcyB0aGF0IHdlIGFyZSBjb25jZXJuZWQgd2l0aFxuI1xuIyAtIHNhbXBsZSByYXRlXG4jIHJ1bnMgYXQgNDQxMDAgaHosIG9uY2UgZm9yIGVhY2ggc2FtcGxlIG9mIGF1ZGlvIHdlIG91dHB1dC4gIEFueSBjb2RlIHJ1bm5pbmdcbiMgYXQgdGhpcyByYXRlIGhhcyBhIGhpZ2ggY29zdCwgc28gcGVyZm9ybWFuY2UgaXMgaW1wb3J0YW50IGhlcmVcbiNcbiMgLSB0aWNrIHJhdGVcbiMgVGlja3MgcnVuIGV2ZXJ5IG4gc2FtcGxlcywgZGVmaW5lZCB1c2luZyB0aGUgY2xvY2tSYXRpbyB2YXJpYWJsZS4gIFRoaXNcbiMgYWxsb3dzIHVzIHRvIGRvIHByb2Nlc3NpbmcgdGhhdCBuZWVkcyB0byBydW4gZnJlcXVlbnRseSwgYnV0IGlzIHRvbyBleHBlbnNpdmVcbiMgdG8gcnVuIGZvciBlYWNoIHNtYXBsZS4gIEZvciBleGFtcGxlLCB0aGlzIGlzIHRoZSB0aW1lIHJlc29sdXRpb24gYXQgd2hpY2hcbiMgd2UgdHJpZ2dlciBuZXcgbm90ZXMuXG4jXG4jIC0gZnJhbWUgcmF0ZVxuIyBUaGUgZnJhbWUgcmF0ZSBpcyB0aGUgc3BlZWQgYXQgd2hpY2ggd2UgdHJpZ2dlciBHVUkgdXBkYXRlcyBmb3IgdGhpbmdzIGxpa2VcbiMgbGV2ZWwgbWV0ZXJzIGFuZCBwbGF5YmFjayBwb3NpdGlvbi4gIHdlIGNvbnRpbnVlIHRvIHJ1biBmcmFtZSB1cGRhdGVzIHdoZXRoZXJcbiMgb24gbm90IGF1ZGlvIGlzIHBsYXlpbmdcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvbmdcblxuICAjIG51bWJlciBvZiBzYW1wbGVzIHRvIHByb2Nlc3MgYmV0d2VlbiB0aWNrc1xuICBjbG9ja1JhdGlvID0gNDQxXG5cbiAgIyByYXRlIGF0IHdoaWNoIGxldmVsIG1ldGVycyBkZWNheVxuICBtZXRlckRlY2F5ID0gMC4wNVxuXG4gIGNsaXAgPSAoc2FtcGxlKSAtPlxuICAgIE1hdGgubWF4KDAsIE1hdGgubWluKDIsIHNhbXBsZSArIDEpKSAtIDFcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbGFzdEJlYXQgPSAwXG5cbiAgICAjIGtlZXAgbXV0YWJsZSBzdGF0ZSBmb3IgYXVkaW8gcGxheWJhY2sgaGVyZSAtIHRoaXMgd2lsbCBzdG9yZSB0aGluZ3MgbGlrZVxuICAgICMgZmlsdGVyIG1lbW9yeSBhbmQgbWV0ZXIgbGV2ZWxzIHRoYXQgbmVlZCB0byBzdGF5IG91dHNpZGUgdGhlIG5vcm1hbCBjdXJzb3JcbiAgICAjIHN0cnVjdHVyZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgIEBzdGF0ZSA9IHt9XG5cbiAgICAjIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgc29uZyBkb2N1bWVudFxuICAgIEBzb25nID0gbnVsbFxuXG4gICAgIyBrZWVwIGEgbGlzdCBvZiB1bnByb2Nlc3NlZCBtaWRpIG1lc3NhZ2VzXG4gICAgQG1pZGlNZXNzYWdlcyA9IFtdXG5cbiAgdXBkYXRlOiAoc3RhdGUpIC0+XG4gICAgQHNvbmcgPSBzdGF0ZVxuXG4gIG1pZGk6IChtZXNzYWdlKSAtPlxuICAgIEBtaWRpTWVzc2FnZXMucHVzaCBtZXNzYWdlXG5cbiAgIyBmaWxsIGEgYnVmZmVyIGZ1bmN0aW9uXG4gIGJ1ZmZlcjogKHNpemUsIGluZGV4LCBzYW1wbGVSYXRlLCBjYikgLT5cbiAgICBhcnIgPSBuZXcgRmxvYXQzMkFycmF5IHNpemVcblxuICAgIGlmIEBzb25nP1xuICAgICAgZm9yIGkgaW4gWzAuLi5zaXplXVxuICAgICAgICBpaSA9IGkgKyBpbmRleFxuICAgICAgICB0ID0gaWkgLyBzYW1wbGVSYXRlXG4gICAgICAgIGFycltpXSA9IEBzYW1wbGUgdCwgaWlcblxuICAgIGNiIGFyci5idWZmZXJcblxuICAgICMgY2xlYXIgbWlkaSBtZXNzYWdlcyBhZnRlciBidWZmZXIgaXMgZmlsbGVkXG4gICAgQG1pZGlNZXNzYWdlcyA9IFtdXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IHNhbXBsZSBvZiBhdWRpb1xuICBzYW1wbGU6ICh0aW1lLCBpKSA9PlxuICAgIEB0aWNrIHRpbWUsIGkgaWYgaSAlIGNsb2NrUmF0aW8gaXMgMFxuXG4gICAgY2xpcCBAc29uZy5sZXZlbCAqIEBzb25nLnRyYWNrcy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtbyArIFRyYWNrLnNhbXBsZSBAc3RhdGUsIHRyYWNrLCB0aW1lLCBpXG4gICAgLCAwKVxuXG4gICMgY2FsbGVkIGZvciBldmVyeSBjbG9ja1JhdGlvIHNhbXBsZXNcbiAgdGljazogKHRpbWUsIGkpID0+XG4gICAgYnBzID0gQHNvbmcuYnBtIC8gNjBcbiAgICBiZWF0ID0gdGltZSAqIGJwc1xuXG4gICAgQHNvbmcudHJhY2tzLmZvckVhY2ggKHRyYWNrLCBpKSA9PlxuXG4gICAgICAjIGZvciBub3cgc2VuZCBtaWRpIG9ubHkgdG8gdGhlIGZpcnN0IHRyYWNrIC0gaW4gdGhlIGZ1dHVyZSB3ZSBzaG91bGRcbiAgICAgICMgYWxsb3cgdHJhY2tzIHRvIGJlIGFybWVkIGZvciByZWNvcmRpbmdcbiAgICAgIG1pZGkgPSBpZiBpIGlzIDAgdGhlbiBAbWlkaSBlbHNlIG51bGxcblxuICAgICAgVHJhY2sudGljayBAc3RhdGUsIHRyYWNrLCBtaWRpLCB0aW1lLCBpLCBiZWF0LCBAbGFzdEJlYXQsIGJwc1xuXG4gICAgQGxhc3RCZWF0ID0gYmVhdFxuXG4gICMgY2FsbGVkIHBlcmlvZGljYWxseSB0byBwYXNzIGhpZ2ggZnJlcXVlbmN5IGRhdGEgdG8gdGhlIHVpLi4gdGhpcyBzaG91bGRcbiAgIyBldmVudHVhbGx5IGJlIHVwZGF0ZWQgdG8gYmFzZSB0aGUgYW1vdW50IG9mIGRlY2F5IG9uIHRoZSBhY3R1YWwgZWxwYXNlZCB0aW1lXG4gIHByb2Nlc3NGcmFtZTogLT5cbiAgICBpZiBAc29uZz8udHJhY2tzP1xuICAgICAgIyBhcHBseSBkZWNheSB0byBtZXRlciBsZXZlbHNcbiAgICAgIGZvciB0cmFjayBpbiBAc29uZy50cmFja3NcbiAgICAgICAgaWYgQHN0YXRlW3RyYWNrLl9pZF0/XG4gICAgICAgICAgQHN0YXRlW3RyYWNrLl9pZF0ubWV0ZXJMZXZlbCAtPSBtZXRlckRlY2F5XG5cbiAgIyBnZXQgYSBzZW5kYWJsZSB2ZXJzaW9uIG9mIGN1cnJlbnQgc29uZyBwbGF5YmFjayBzdGF0ZVxuICBnZXRTdGF0ZTogLT5cbiAgICBtZXRlckxldmVsczogQHNvbmc/LnRyYWNrcz8ucmVkdWNlKChtZW1vLCB0cmFjaykgPT5cbiAgICAgIG1lbW9bdHJhY2suX2lkXSA9IEBzdGF0ZVt0cmFjay5faWRdPy5tZXRlckxldmVsXG4gICAgICBtZW1vXG4gICAgLCB7fSlcbiIsImluc3RydW1lbnRUeXBlcyA9XG4gIEFuYWxvZ1N5bnRoZXNpemVyOiByZXF1aXJlICcuL2FuYWxvZ19zeW50aGVzaXplcidcbiAgQmFzaWNTYW1wbGVyOiByZXF1aXJlICcuL2Jhc2ljX3NhbXBsZXInXG4gIERydW1TYW1wbGVyOiByZXF1aXJlICcuL2RydW1fc2FtcGxlcidcbiAgRHJ1bVN5bnRoZXNpemVyOiByZXF1aXJlICcuL2RydW1fc3ludGhlc2l6ZXInXG4gIExvb3BTYW1wbGVyOiByZXF1aXJlICcuL2xvb3Bfc2FtcGxlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRyYWNrXG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIHRyYWNrKSAtPlxuICAgIHN0YXRlW3RyYWNrLl9pZF0gPVxuICAgICAgbWV0ZXJMZXZlbDogMFxuXG4gIEByZWxlYXNlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgZGVsZXRlIHN0YXRlW3RyYWNrLl9pZF1cblxuICBAc2FtcGxlOiAoc3RhdGUsIHRyYWNrLCB0aW1lLCBpKSAtPlxuICAgICMgZ2V0IGluc3RydW1lbnQgb3V0cHV0XG4gICAgSW5zdHJ1bWVudCA9IGluc3RydW1lbnRUeXBlc1t0cmFjay5pbnN0cnVtZW50Ll90eXBlXVxuICAgIHNhbXBsZSA9IEluc3RydW1lbnQuc2FtcGxlIHN0YXRlLCB0cmFjay5pbnN0cnVtZW50LCB0aW1lLCBpXG5cbiAgICAjIGFwcGx5IGVmZmVjdHNcbiAgICBzYW1wbGUgPSB0cmFjay5lZmZlY3RzLnJlZHVjZSgoc2FtcGxlLCBlZmZlY3QpIC0+XG4gICAgICBFZmZlY3Quc2FtcGxlIHN0YXRlLCBlZmZlY3QsIHRpbWUsIGksIHNhbXBsZVxuICAgICwgc2FtcGxlKVxuXG4gICAgIyB1cGRhdGUgbWV0ZXIgbGV2ZWxzXG4gICAgaWYgdHJhY2tTdGF0ZSA9IHN0YXRlW3RyYWNrLl9pZF1cbiAgICAgIGxldmVsID0gdHJhY2tTdGF0ZS5tZXRlckxldmVsXG4gICAgICBpZiBub3QgbGV2ZWw/IG9yIGlzTmFOKGxldmVsKSBvciBzYW1wbGUgPiBsZXZlbFxuICAgICAgICB0cmFja1N0YXRlLm1ldGVyTGV2ZWwgPSBzYW1wbGVcblxuICAgIHNhbXBsZVxuXG4gIEB0aWNrOiAoc3RhdGUsIHRyYWNrLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGksIGJlYXQsIGxhc3RCZWF0LCBicHMpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCB0cmFjayB1bmxlc3Mgc3RhdGVbdHJhY2suX2lkXT9cblxuICAgIEluc3RydW1lbnQgPSBpbnN0cnVtZW50VHlwZXNbdHJhY2suaW5zdHJ1bWVudC5fdHlwZV1cblxuICAgICMgZ2V0IG5vdGVzIG9uIGZyb20gc2VxdWVuY2VcbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9ID0gQG5vdGVzIHRyYWNrLnNlcXVlbmNlLCBtaWRpTWVzc2FnZXMsIGJlYXQsIGxhc3RCZWF0XG5cbiAgICBJbnN0cnVtZW50LnRpY2sgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIG1pZGksIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmZcbiAgICB0cmFjay5lZmZlY3RzLmZvckVhY2ggKGUpIC0+IGUudGljayBzdGF0ZSwgdGltZSwgYmVhdCwgYnBzXG5cbiAgIyBsb29rIGF0IHNlcXVlbmNlIGFuZCBtaWRpIG1lc3NhZ2VzLCByZXR1cm4gYXJyYXlzIG9mIG5vdGVzIG9uIGFuZCBvZmZcbiAgIyBvY2N1cnJpbmcgaW4gdGhpcyB0aWNrXG4gIEBub3RlczogKHNlcXVlbmNlLCBtaWRpTWVzc2FnZXMsIGJlYXQsIGxhc3RCZWF0KSAtPlxuICAgIGJhciA9IE1hdGguZmxvb3IgYmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgbGFzdEJhciA9IE1hdGguZmxvb3IgbGFzdEJlYXQgLyBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGJlYXQgPSBiZWF0ICUgc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmVhdCA9IGxhc3RCZWF0ICUgc2VxdWVuY2UubG9vcFNpemVcblxuICAgIG5vdGVzT24gPSBbXVxuICAgIG5vdGVzT2ZmID0gW11cblxuICAgIGZvciBpZCwgbm90ZSBvZiBzZXF1ZW5jZS5ub3Rlc1xuICAgICAgc3RhcnQgPSBub3RlLnN0YXJ0XG4gICAgICBlbmQgPSBub3RlLnN0YXJ0ICsgbm90ZS5sZW5ndGhcbiAgICAgIGlmIHN0YXJ0IDwgYmVhdCBhbmQgKHN0YXJ0ID49IGxhc3RCZWF0IG9yIGJhciA+IGxhc3RCYXIpXG4gICAgICAgIG5vdGVzT24ucHVzaCB7a2V5OiBub3RlLmtleX1cbiAgICAgIGlmIGVuZCA8IGJlYXQgYW5kIChlbmQgPj0gbGFzdEJlYXQgb3IgYmFyID4gbGFzdGJhcilcbiAgICAgICAgbm90ZXNPZmYucHVzaCB7a2V5OiBub3RlLmtleX1cblxuICAgIGZvciBtZXNzYWdlIGluIG1pZGlNZXNzYWdlc1xuICAgICAgdGltZSA9IG1lc3NhZ2UudGltZVxuICAgICAgaWYgdGltZSA8IGJlYXQgYW5kICh0aW1lID49IGxhc3RCZWF0IG9yIGJhciA+IGxhc3RCYXIpXG4gICAgICAgIHN3aXRjaCBtZXNzYWdlLnR5cGVcbiAgICAgICAgICB3aGVuICdvbidcbiAgICAgICAgICAgIG5vdGVzT24ucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG4gICAgICAgICAgd2hlbiAnb2ZmJ1xuICAgICAgICAgICAgbm90ZXNPZmYucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG5cbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9XG4iXX0=
