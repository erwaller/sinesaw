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
        if (time > r + note.timeOff) {
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
    notesOff.forEach(function(_arg) {
      var key;
      key = _arg.key;
      return instrumentState.noteMap[key].timeOff = time;
    });
    return notesOn.forEach(function(_arg) {
      var key;
      key = _arg.key;
      instrumentState.noteMap[key] = {
        time: time,
        i: i,
        key: key
      };
      return instrumentState.notes.push(instrumentState.noteMap[key]);
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
        midiMessages = i === _this.song.selectedTrack ? _this.midiMessages : null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL29zY2lsbGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3JpbmdfYnVmZmVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9kcnVtX3N5bnRoZXNpemVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9pbnN0cnVtZW50LmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9sb29wX3NhbXBsZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3NvbmcuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3RyYWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1lBLElBQUEsVUFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLG1CQUFSLENBQVAsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sR0FBQSxDQUFBLElBRlAsQ0FBQTs7QUFBQSxJQUlJLENBQUMsU0FBTCxHQUFpQixPQUFBLENBQVEsNkJBQVIsQ0FKakIsQ0FBQTs7QUFBQSxJQU9JLENBQUMsU0FBTCxHQUFpQixTQUFDLENBQUQsR0FBQTtBQUNmLFVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFkO0FBQUEsU0FDTyxRQURQO2FBRUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQW5CLEVBRko7QUFB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QjtBQUNFLFVBQUEsWUFBWSxDQUFDLE1BQWIsQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsQ0FBQSxDQUFBO0FBQ0Esa0JBQU8sT0FBTyxDQUFDLElBQWY7QUFBQSxpQkFDTyxJQURQO3FCQUVJLE9BQU8sQ0FBQyxJQUFSLENBQWE7QUFBQSxnQkFBQSxHQUFBLEVBQUssT0FBTyxDQUFDLEdBQWI7ZUFBYixFQUZKO0FBQUEsaUJBR08sS0FIUDtxQkFJSSxRQUFRLENBQUMsSUFBVCxDQUFjO0FBQUEsZ0JBQUEsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUFiO2VBQWQsRUFKSjtBQUFBLFdBRkY7U0FEbUI7TUFBQSxDQUFyQixDQUFBLENBREY7S0FoQkE7V0EwQkE7QUFBQSxNQUFDLFNBQUEsT0FBRDtBQUFBLE1BQVUsVUFBQSxRQUFWO01BM0JNO0VBQUEsQ0F0Q1IsQ0FBQTs7ZUFBQTs7SUFWRixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMgdGhpcyBzY3JpcHQgaXMgcnVuIGluc2lkZSBhIHdvcmtlciBpbiBvcmRlciB0byBkbyBhdWRpbyBwcm9jZXNzaW5nIG91dHNpZGUgb2ZcbiMgdGhlIG1haW4gdWkgdGhyZWFkLlxuI1xuIyBUaGUgd29ya2VyIHJlY2VpdmVzIHRocmVlIHR5cGVzIG9mIG1lc3NhZ2VzIC0gJ3VwZGF0ZScgdy8ge3N0YXRlfSBjb250YWluaW5nXG4jIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzb25nLCAnbWlkaScgdy8ge21lc3NhZ2V9IGNvbnRhaW5pbmcgaW5jb21pbmcgbm90ZU9uXG4jIGFuZCBub3RlT2ZmIG1lc3NhZ2VzLCBhbmQgJ2J1ZmZlcicgdy8ge3NpemUsIGluZGV4LCBzYW1wbGVSYXRlfSByZXF1ZXN0aW5nXG4jIGEgYnVmZmVyIHRvIGJlIGZpbGxlZCBhbmQgc2VudCBiYWNrLlxuI1xuIyBJdCBhbHNvIHNlbmRzIHR3byB0eXBlcyBvZiBtZXNzYWdlcyAtICdmcmFtZScgbWVzc2FnZXMgYXQgNjBoeiBjb250YWluaW5nIHRoZVxuIyBjdXJyZW50IHBsYXliYWNrIHN0YXRlIGFzIHtmcmFtZX0sIGFuZCBzZW5kcyAnYnVmZmVyJyBtZXNzYWdlcyB0cmFuc2ZlcnJpbmdcbiMgZmlsbGVkIEFycmF5QnVmZmVycyBpbiByZXNwb25zZSB0byAnYnVmZmVyJyByZXF1ZXN0cy5cblxuU29uZyA9IHJlcXVpcmUgJy4vZHNwL3NvbmcuY29mZmVlJ1xuXG5zb25nID0gbmV3IFNvbmdcblxuc2VsZi5sb2dTYW1wbGUgPSByZXF1aXJlICcuL2RzcC9jb21wb25lbnRzL2xvZ19zYW1wbGUnXG5cbiMgcmVzcG9uZCB0byBtZXNzYWdlcyBmcm9tIHBhcmVudCB0aHJlYWRcbnNlbGYub25tZXNzYWdlID0gKGUpIC0+XG4gIHN3aXRjaCBlLmRhdGEudHlwZVxuICAgIHdoZW4gJ3VwZGF0ZSdcbiAgICAgIHNvbmcudXBkYXRlIGUuZGF0YS5zdGF0ZVxuICAgIHdoZW4gJ21pZGknXG4gICAgICBzb25nLm1pZGkgZS5kYXRhLm1lc3NhZ2VcbiAgICB3aGVuICdidWZmZXInXG4gICAgICBzb25nLmJ1ZmZlciBlLmRhdGEuc2l6ZSwgZS5kYXRhLmluZGV4LCBlLmRhdGEuc2FtcGxlUmF0ZSwgKGJ1ZmZlcikgLT5cbiAgICAgICAgcG9zdE1lc3NhZ2VcbiAgICAgICAgICB0eXBlOiAnYnVmZmVyJ1xuICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyXG4gICAgICAgICwgW2J1ZmZlcl1cblxuIyB0cmlnZ2VyIHByb2Nlc3Npbmcgb24gc29uZyBhdCBmcmFtZSByYXRlIGFuZCBzZW5kIHVwZGF0ZXMgdG8gdGhlIHBhcmVudCB0aHJlYWRcbnNldEludGVydmFsIC0+XG4gIHNvbmcucHJvY2Vzc0ZyYW1lKClcbiAgcG9zdE1lc3NhZ2VcbiAgICB0eXBlOiAnZnJhbWUnXG4gICAgZnJhbWU6IHNvbmcuZ2V0U3RhdGUoKVxuLCAxMDAwIC8gNjBcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xubG93cGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlcidcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xub3NjaWxsYXRvcnMgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvb3NjaWxsYXRvcnMnXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBBbmFsb2dTeW50aGVzaXplciBleHRlbmRzIEluc3RydW1lbnRcblxuICB0dW5lID0gNDQwXG4gIGZyZXF1ZW5jeSA9IChrZXkpIC0+XG4gICAgdHVuZSAqIE1hdGgucG93IDIsIChrZXkgLSA2OSkgLyAxMlxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN1cGVyIHN0YXRlLCBpbnN0cnVtZW50XG5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVycyA9XG4gICAgICBMUDogKGxvd3Bhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIEhQOiAoaGlnaHBhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIG5vbmU6ICgoKHNhbXBsZSkgLT4gc2FtcGxlKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgICMgc3VtIGFsbCBhY3RpdmUgbm90ZXNcbiAgICByID0gTWF0aC5tYXggMC4wMSwgaW5zdHJ1bWVudC52b2x1bWVFbnYuclxuICAgIGluc3RydW1lbnQubGV2ZWwgKiBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXMucmVkdWNlKChtZW1vLCBub3RlLCBpbmRleCkgPT5cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuICAgICAgcmV0dXJuIG1lbW8gaWYgdGltZSA+IHIgKyBub3RlLnRpbWVPZmZcblxuICAgICAgIyBzdW0gb3NjaWxsYXRvcnMgYW5kIGFwcGx5IHZvbHVtZSBlbnZlbG9wZVxuICAgICAgb3NjMUZyZXEgPSBmcmVxdWVuY3kgbm90ZS5rZXkgKyBpbnN0cnVtZW50Lm9zYzEudHVuZSAtIDAuNSArIE1hdGgucm91bmQoMjQgKiAoaW5zdHJ1bWVudC5vc2MxLnBpdGNoIC0gMC41KSlcbiAgICAgIG9zYzJGcmVxID0gZnJlcXVlbmN5IG5vdGUua2V5ICsgaW5zdHJ1bWVudC5vc2MyLnR1bmUgLSAwLjUgKyBNYXRoLnJvdW5kKDI0ICogKGluc3RydW1lbnQub3NjMi5waXRjaCAtIDAuNSkpXG4gICAgICBzYW1wbGUgPSBlbnZlbG9wZShpbnN0cnVtZW50LnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoXG4gICAgICAgIGluc3RydW1lbnQub3NjMS5sZXZlbCAqIG9zY2lsbGF0b3JzW2luc3RydW1lbnQub3NjMS53YXZlZm9ybV0odGltZSwgb3NjMUZyZXEpICtcbiAgICAgICAgaW5zdHJ1bWVudC5vc2MyLmxldmVsICogb3NjaWxsYXRvcnNbaW5zdHJ1bWVudC5vc2MyLndhdmVmb3JtXSh0aW1lLCBvc2MyRnJlcSlcbiAgICAgIClcblxuICAgICAgIyBhcHBseSBmaWx0ZXIgd2l0aCBlbnZlbG9wZVxuICAgICAgY3V0b2ZmID0gTWF0aC5taW4gMSwgaW5zdHJ1bWVudC5maWx0ZXIuZnJlcSArIGluc3RydW1lbnQuZmlsdGVyLmVudiAqIGVudmVsb3BlKGluc3RydW1lbnQuZmlsdGVyRW52LCBub3RlLCB0aW1lKVxuICAgICAgZmlsdGVyID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnNbaW5zdHJ1bWVudC5maWx0ZXIudHlwZV1baW5kZXhdXG4gICAgICBzYW1wbGUgPSBmaWx0ZXIgc2FtcGxlLCBjdXRvZmYsIGluc3RydW1lbnQuZmlsdGVyLnJlc1xuXG4gICAgICAjIHJldHVybiByZXN1bHRcbiAgICAgIG1lbW8gKyBzYW1wbGVcblxuICAgICwgMClcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xubGluZWFySW50ZXJwb2xhdG9yID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xpbmVhcl9pbnRlcnBvbGF0b3InXG5sb3dwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyJ1xuaGlnaHBhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvaGlnaHBhc3NfZmlsdGVyJ1xuZW52ZWxvcGUgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvZW52ZWxvcGUnXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBCYXNpY1NhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgQGRlZmF1bHRzOlxuICAgIF90eXBlOiAnQmFzaWNTYW1wbGVyJ1xuICAgIGxldmVsOiAwLjVcbiAgICBwYW46IDAuNVxuICAgIHBvbHlwaG9ueTogMVxuICAgIG1heFBvbHlwaG9ueTogNlxuICAgIHJvb3RLZXk6IDYwXG4gICAgc2FtcGxlRGF0YTogbnVsbFxuICAgIHNhbXBsZU5hbWU6ICcnXG4gICAgc3RhcnQ6IDAuM1xuICAgIGxvb3BBY3RpdmU6ICdsb29wJ1xuICAgIGxvb3A6IDAuN1xuICAgIHR1bmU6IDAuNVxuICAgIHZvbHVtZUVudjpcbiAgICAgIGE6IDBcbiAgICAgIGQ6IDAuMjVcbiAgICAgIHM6IDFcbiAgICAgIHI6IDAuNVxuICAgIGZpbHRlckVudjpcbiAgICAgIGE6IDBcbiAgICAgIGQ6IDAuMjVcbiAgICAgIHM6IDFcbiAgICAgIHI6IDAuNVxuICAgIGZpbHRlcjpcbiAgICAgIHR5cGU6ICdub25lJ1xuICAgICAgZnJlcTogMC4yN1xuICAgICAgcmVzOiAwLjA1XG4gICAgICBlbnY6IDAuNDVcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdXBlciBzdGF0ZSwgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG4gICAgcmV0dXJuIDAgdW5sZXNzIGluc3RydW1lbnQuc2FtcGxlRGF0YT9cblxuICAgIHIgPSBNYXRoLm1heCAwLjAxLCBpbnN0cnVtZW50LnZvbHVtZUVudi5yXG5cbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlLmxlbiArIHIgPiB0aW1lIC0gbm90ZS50aW1lXG5cbiAgICAgICMgZ2V0IHBpdGNoIHNoaWZ0ZWQgaW50ZXJwb2xhdGVkIHNhbXBsZSBhbmQgYXBwbHkgdm9sdW1lIGVudmVsb3BlXG4gICAgICB0cmFuc3Bvc2UgPSBub3RlLmtleSAtIGluc3RydW1lbnQucm9vdEtleSArIGluc3RydW1lbnQudHVuZSAtIDAuNVxuICAgICAgc2FtcGxlc0VsYXBzZWQgPSBpIC0gbm90ZS5pXG4gICAgICBvZmZzZXQgPSBNYXRoLmZsb29yIGluc3RydW1lbnQuc3RhcnQgKiBpbnN0cnVtZW50LnNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBsb29wUG9pbnQgPSBNYXRoLmZsb29yIGluc3RydW1lbnQubG9vcCAqIGluc3RydW1lbnQuc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIHNhbXBsZSA9IGxpbmVhckludGVycG9sYXRvciBpbnN0cnVtZW50LnNhbXBsZURhdGEsIHRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldCwgaW5zdHJ1bWVudC5sb29wQWN0aXZlID09ICdsb29wJywgbG9vcFBvaW50XG4gICAgICBzYW1wbGUgPSBlbnZlbG9wZShpbnN0cnVtZW50LnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJtaW5FbnZWYWx1ZSA9IDAuMDFcblxubW9kdWxlLmV4cG9ydHMgPSAoZW52LCBub3RlLCB0aW1lKSAtPlxuICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICBhID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5hXG4gIGQgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmRcbiAgcyA9IGVudi5zXG4gIHIgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LnJcblxuICAjIGF0dGFjaywgZGVjYXksIHN1c3RhaW5cbiAgbCA9IGlmIGVsYXBzZWQgPiBhICsgZFxuICAgIGwgPSBzXG4gIGVsc2UgaWYgZWxhcHNlZCA+IGFcbiAgICBsID0gcyArICgxIC0gcykgKiAoYSArIGQgLSBlbGFwc2VkKSAvIGRcbiAgZWxzZVxuICAgIGVsYXBzZWQgLyBhXG5cbiAgIyByZWxlYXNlXG4gIGlmIG5vdGUudGltZU9mZlxuICAgIGwgPSBsICogKG5vdGUudGltZU9mZiArIHIgLSB0aW1lKSAvIHJcblxuICBNYXRoLm1heCAwLCBsXG4iLCJzYW1wbGVSYXRlID0gNDgwMDBcbm1heEZyZXEgPSAxMjAwMFxuZGJHYWluID0gMTIgICAgIyBnYWluIG9mIGZpbHRlclxuYmFuZHdpZHRoID0gMSAgIyBiYW5kd2lkdGggaW4gb2N0YXZlc1xuXG4jIGNvbnN0YW50c1xuQSA9IE1hdGgucG93KDEwLCBkYkdhaW4gLyA0MClcbmUgPSBNYXRoLmxvZygyKVxudGF1ID0gMiAqIE1hdGguUElcbmJldGEgPSBNYXRoLnNxcnQoMiAqIEEpXG5cbiMgaHlwZXJib2xpYyBzaW4gZnVuY3Rpb25cbnNpbmggPSAoeCkgLT5cbiAgeSA9IE1hdGguZXhwIHhcbiAgKHkgLSAxIC8geSkgLyAyXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgYTAgPSBhMSA9IGEyID0gYTMgPSBhNCA9IHgxID0geDIgPSB5MSA9IHkyID0gMFxuICBmcmVxID0gb21lZ2EgPSBzbiA9IGFscGhhID0gMFxuICBjcyA9IDFcblxuICBsYXN0Q3V0b2ZmID0gMFxuXG4gIChzYW1wbGUsIGN1dG9mZikgLT5cbiAgICAjIGNhY2hlIGZpbHRlciB2YWx1ZXMgdW50aWwgY3V0b2ZmIGNoYW5nZXNcbiAgICBpZiBjdXRvZmYgIT0gbGFzdEN1dG9mZlxuICBcbiAgICAgIG9sZEN1dG9mZiA9IGN1dG9mZlxuXG4gICAgICBmcmVxID0gY3V0b2ZmICogbWF4RnJlcVxuICAgICAgb21lZ2EgPSB0YXUgKiBmcmVxIC8gc2FtcGxlUmF0ZVxuICAgICAgc24gPSBNYXRoLnNpbiBvbWVnYVxuICAgICAgY3MgPSBNYXRoLmNvcyBvbWVnYVxuICAgICAgYWxwaGEgPSBzbiAqIHNpbmgoZSAvIDIgKiBiYW5kd2lkdGggKiBvbWVnYSAvIHNuKVxuXG4gICAgICBiMCA9ICgxICsgY3MpIC8gMlxuICAgICAgYjEgPSAtKDEgKyBjcylcbiAgICAgIGIyID0gKDEgKyBjcykgLyAyXG4gICAgICBhYTAgPSAxICsgYWxwaGFcbiAgICAgIGFhMSA9IC0yICogY3NcbiAgICAgIGFhMiA9IDEgLSBhbHBoYVxuXG4gICAgICBhMCA9IGIwIC8gYWEwXG4gICAgICBhMSA9IGIxIC8gYWEwXG4gICAgICBhMiA9IGIyIC8gYWEwXG4gICAgICBhMyA9IGFhMSAvIGFhMFxuICAgICAgYTQgPSBhYTIgLyBhYTBcblxuICAgICMgY29tcHV0ZSByZXN1bHRcbiAgICBzID0gTWF0aC5tYXggLTEsIE1hdGgubWluIDEsIHNhbXBsZVxuICAgIHJlc3VsdCA9IGEwICogcyArIGExICogeDEgKyBhMiAqIHgyIC0gYTMgKiB5MSAtIGE0ICogeTJcblxuICAgICMgc2hpZnQgeDEgdG8geDIsIHNhbXBsZSB0byB4MVxuICAgIHgyID0geDFcbiAgICB4MSA9IHNcblxuICAgICMgc2hpZnQgeTEgdG8geTIsIHJlc3VsdCB0byB5MVxuICAgIHkyID0geTFcbiAgICB5MSA9IHJlc3VsdFxuXG4gICAgcmVzdWx0IiwibW9kdWxlLmV4cG9ydHMgPSAoc2FtcGxlRGF0YSwgdHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0ID0gMCwgbG9vcEFjdGl2ZSA9IGZhbHNlLCBsb29wUG9pbnQpIC0+XG4gIGkgPSBzYW1wbGVzRWxhcHNlZCAqIE1hdGgucG93IDIsIHRyYW5zcG9zZSAvIDEyXG4gIGkxID0gTWF0aC5mbG9vciBpXG4gIGkxID0gaTEgJSAobG9vcFBvaW50IC0gb2Zmc2V0KSBpZiBsb29wQWN0aXZlXG4gIGkyID0gaTEgKyAxXG4gIGwgPSBpICUgMVxuXG4gIHNhbXBsZURhdGFbb2Zmc2V0ICsgaTFdICogKDEgLSBsKSArIHNhbXBsZURhdGFbb2Zmc2V0ICsgaTJdICogbCIsImkgPSAwXG5tb2R1bGUuZXhwb3J0cyA9ICh2KSAtPlxuICBjb25zb2xlLmxvZyh2KSBpZiBpID09IDBcbiAgaSA9IChpICsgMSkgJSA3MDAwXG4iLCJzYW1wbGVSYXRlID0gNDgwMDBcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuXG4gIHkxID0geTIgPSB5MyA9IHk0ID0gb2xkeCA9IG9sZHkxID0gb2xkeTIgPSBvbGR5MyA9IDBcbiAgcCA9IGsgPSB0MSA9IHQyID0gciA9IHggPSBudWxsXG5cbiAgKHNhbXBsZSwgY3V0b2ZmLCByZXMpIC0+XG4gICAgZnJlcSA9IDIwICogTWF0aC5wb3cgMTAsIDMgKiBjdXRvZmZcbiAgICBmcmVxID0gZnJlcSAvIHNhbXBsZVJhdGVcbiAgICBwID0gZnJlcSAqICgxLjggLSAoMC44ICogZnJlcSkpXG4gICAgayA9IDIgKiBNYXRoLnNpbihmcmVxICogTWF0aC5QSSAvIDIpIC0gMVxuICAgIHQxID0gKDEgLSBwKSAqIDEuMzg2MjQ5XG4gICAgdDIgPSAxMiArIHQxICogdDFcbiAgICByID0gcmVzICogMC41NyAqICh0MiArIDYgKiB0MSkgLyAodDIgLSA2ICogdDEpXG5cbiAgICB4ID0gc2FtcGxlIC0gciAqIHk0XG5cbiAgICAjIGZvdXIgY2FzY2FkZWQgb25lLXBvbGUgZmlsdGVycyAoYmlsaW5lYXIgdHJhbnNmb3JtKVxuICAgIHkxID0gIHggKiBwICsgb2xkeCAgKiBwIC0gayAqIHkxXG4gICAgeTIgPSB5MSAqIHAgKyBvbGR5MSAqIHAgLSBrICogeTJcbiAgICB5MyA9IHkyICogcCArIG9sZHkyICogcCAtIGsgKiB5M1xuICAgIHk0ID0geTMgKiBwICsgb2xkeTMgKiBwIC0gayAqIHk0XG5cbiAgICAjIGNsaXBwZXIgYmFuZCBsaW1pdGVkIHNpZ21vaWRcbiAgICB5NCAtPSAoeTQgKiB5NCAqIHk0KSAvIDZcblxuICAgIG9sZHggPSB4XG4gICAgb2xkeTEgPSB5MVxuICAgIG9sZHkyID0geTJcbiAgICBvbGR5MyA9IHkzXG5cbiAgICB5NCIsInRhdSA9IE1hdGguUEkgKiAyXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBzaW5lOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIE1hdGguc2luIHRpbWUgKiB0YXUgKiBmcmVxdWVuY3lcblxuICBzcXVhcmU6ICh0aW1lLCBmcmVxdWVuY3kpIC0+XG4gICAgaWYgKCh0aW1lICUgKDEgLyBmcmVxdWVuY3kpKSAqIGZyZXF1ZW5jeSkgJSAxID4gMC41IHRoZW4gMSBlbHNlIC0xXG5cbiAgc2F3OiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIDEgLSAyICogKCgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSlcblxuICBub2lzZTogLT5cbiAgICAyICogTWF0aC5yYW5kb20oKSAtIDEiLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJpbmdCdWZmZXJcbiAgXG4gIGNvbnN0cnVjdG9yOiAoQG1heExlbmd0aCwgQFR5cGUgPSBGbG9hdDMyQXJyYXksIEBsZW5ndGgpIC0+XG4gICAgQGxlbmd0aCB8fD0gQG1heExlbmd0aFxuICAgIEBhcnJheSA9IG5ldyBUeXBlIEBtYXhMZW5ndGhcbiAgICBAcG9zID0gMFxuXG4gIHJlc2V0OiAtPlxuICAgIEBhcnJheSA9IG5ldyBAVHlwZSBAbWF4TGVuZ3RoXG4gICAgdGhpc1xuXG4gIHJlc2l6ZTogKEBsZW5ndGgpIC0+XG4gICAgQHBvcyA9IDAgaWYgQHBvcyA+PSBAbGVuZ3RoXG5cbiAgcHVzaDogKGVsKSAtPlxuICAgIEBhcnJheVtAcG9zXSA9IGVsXG4gICAgQHBvcyArPSAxXG4gICAgQHBvcyA9IDAgaWYgQHBvcyA9PSBAbGVuZ3RoXG4gICAgdGhpc1xuXG4gIGZvckVhY2g6IChmbikgLT5cbiAgICBgdmFyIGksIGxlbjtcbiAgICBmb3IgKGkgPSB0aGlzLnBvcywgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgZm4odGhpcy5hcnJheVtpXSwgaSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMucG9zOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICAgIH1gXG4gICAgdGhpc1xuXG4gIHJlZHVjZTogKGZuLCBtZW1vID0gMCkgLT5cbiAgICBAZm9yRWFjaCAoZWwsIGkpIC0+XG4gICAgICBtZW1vID0gZm4gbWVtbywgZWwsIGlcbiAgICBtZW1vXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChkZWNheSwgZWxhcHNlZCkgLT5cbiAgaWYgZWxhcHNlZCA+IGRlY2F5XG4gICAgMFxuICBlbHNlXG4gICAgMSAtIGVsYXBzZWQgLyBkZWNheVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xubGluZWFySW50ZXJwb2xhdG9yID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xpbmVhcl9pbnRlcnBvbGF0b3InXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcnVtU2FtcGxlciBleHRlbmRzIEluc3RydW1lbnRcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgdG8gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bVxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPSBub3Rlczoge31cblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgICMgc3VtIGFsbCBhY3RpdmUgbm90ZXNcbiAgICBpbnN0cnVtZW50LmxldmVsICogaW5zdHJ1bWVudC5kcnVtcy5yZWR1Y2UoKG1lbW8sIGRydW0pID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3MgZHJ1bS5zYW1wbGVEYXRhP1xuXG4gICAgICBub3RlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW2RydW0ua2V5XVxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG5cbiAgICAgIHNhbXBsZXNFbGFwc2VkID0gaSAtIG5vdGUuaVxuICAgICAgb2Zmc2V0ID0gTWF0aC5mbG9vciBkcnVtLnN0YXJ0ICogZHJ1bS5zYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgcmV0dXJuIG1lbW8gaWYgc2FtcGxlc0VsYXBzZWQgKyBvZmZzZXQgPiBkcnVtLnNhbXBsZURhdGEubGVuZ3RoXG5cbiAgICAgIHNhbXBsZSA9IGxpbmVhckludGVycG9sYXRvciBkcnVtLnNhbXBsZURhdGEsIGRydW0udHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0XG4gICAgICBtZW1vICsgZHJ1bS5sZXZlbCAqIGVudmVsb3BlKGRydW0udm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChzYW1wbGUgb3IgMClcbiAgICAsIDApXG5cbiAgQHRpY2s6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSwgYmVhdCwgYnBzLCBub3Rlc09uKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgbm90ZXNPbi5mb3JFYWNoIChub3RlKSA9PlxuICAgICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW25vdGUua2V5XSA9IHt0aW1lLCBpLCBsZW46IG5vdGUubGVuZ3RoIC8gYnBzfVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbnNpbXBsZUVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJ1bVN5bnRoZXNpemVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIG1pbkZyZXEgPSA2MFxuICBtYXhGcmVxID0gMzAwMFxuICBmcmVxU2NhbGUgPSBtYXhGcmVxIC0gbWluRnJlcVxuXG4gICMga2VlcCBub3RlcyBpbiBhIG1hcCB7a2V5OiBub3RlRGF0YX0gaW5zdGVhZCBvZiBpbiBhIHJpbmcgYnVmZmVyXG4gICMgdGhpcyBnaXZlcyB1cyBvbmUgbW9ucGhvbmljIHZvaWNlIHBlciBkcnVtLlxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPVxuICAgICAgbm90ZXM6IHt9XG4gICAgICBmaWx0ZXJzOiAoXG4gICAgICAgIGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi4xMjddXG4gICAgICApXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIGluc3RydW1lbnQuZHJ1bXMucmVkdWNlKChtZW1vLCBkcnVtKSA9PlxuICAgICAgbm90ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tkcnVtLmtleV1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuXG4gICAgICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICAgICAgcmV0dXJuIG1lbW8gaWYgZWxhcHNlZCA+IGRydW0uZGVjYXlcblxuICAgICAgZW52ID0gc2ltcGxlRW52ZWxvcGUgZHJ1bS5kZWNheSwgZWxhcHNlZFxuICAgICAgZnJlcSA9IG1pbkZyZXEgKyBkcnVtLnBpdGNoICogZnJlcVNjYWxlXG5cbiAgICAgICMgYXBwbHkgcGl0Y2ggYmVuZFxuICAgICAgaWYgZHJ1bS5iZW5kXG4gICAgICAgIGZyZXEgPSAoMiAtIGRydW0uYmVuZCArIGRydW0uYmVuZCAqIGVudikgLyAyICogZnJlcVxuXG4gICAgICAjIGFwcGx5IGZtXG4gICAgICBpZiBkcnVtLmZtID4gMFxuICAgICAgICBzaWduYWwgPSBvc2NpbGxhdG9ycy5zaW5lIGVsYXBzZWQsIG1pbkZyZXEgKyBkcnVtLmZtRnJlcSAqIGZyZXFTY2FsZVxuICAgICAgICBmcmVxICs9IGRydW0uZm0gKiBzaWduYWwgKiBzaW1wbGVFbnZlbG9wZShkcnVtLmZtRGVjYXkgKyAwLjAxLCBlbGFwc2VkKVxuXG4gICAgICAjIHN1bSBub2lzZSBhbmQgb3NjaWxsYXRvclxuICAgICAgc2FtcGxlID0gKFxuICAgICAgICAoMSAtIGRydW0ubm9pc2UpICogb3NjaWxsYXRvcnMuc2luZShlbGFwc2VkLCBmcmVxKSArXG4gICAgICAgIGRydW0ubm9pc2UgKiBvc2NpbGxhdG9ycy5ub2lzZSgpXG4gICAgICApXG5cbiAgICAgICMgYXBwbHkgaGlnaHBhc3NcbiAgICAgIGlmIGRydW0uaHAgPiAwXG4gICAgICAgIHNhbXBsZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2RydW0ua2V5XSBzYW1wbGUsIGRydW0uaHBcblxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnYgKiBzYW1wbGVcblxuICAgICwgMClcblxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tub3RlLmtleV0gPSB7dGltZSwgaSwgbGVuOiBub3RlLmxlbmd0aCAvIGJwc31cblxuIiwiUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEluc3RydW1lbnRcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPVxuICAgICAgbm90ZXM6IG5ldyBSaW5nQnVmZmVyIGluc3RydW1lbnQubWF4UG9seXBob255LCBBcnJheSwgaW5zdHJ1bWVudC5wb2x5cGhvbnlcbiAgICAgIG5vdGVNYXA6IHt9XG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIGRlbGV0ZSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF1cblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgMFxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmYpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG4gICAgaW5zdHJ1bWVudFN0YXRlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgICBpZiBpbnN0cnVtZW50LnBvbHlwaG9ueSAhPSBpbnN0cnVtZW50U3RhdGUubm90ZXMubGVuZ3RoXG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucmVzaXplIGluc3RydW1lbnQucG9seXBob255XG5cbiAgICBub3Rlc09mZi5mb3JFYWNoICh7a2V5fSkgLT5cbiAgICAgICMgY29uc29sZS5sb2cgJ25vdGUgb2ZmICcgKyBrZXlcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3RlTWFwW2tleV0udGltZU9mZiA9IHRpbWVcblxuICAgIG5vdGVzT24uZm9yRWFjaCAoe2tleX0pIC0+XG4gICAgICAjIGNvbnNvbGUubG9nICdub3RlIG9uICcgKyBrZXlcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3RlTWFwW2tleV0gPSB7dGltZSwgaSwga2V5fVxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVzLnB1c2ggaW5zdHJ1bWVudFN0YXRlLm5vdGVNYXBba2V5XVxuXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvb3BTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuIiwiVHJhY2sgPSByZXF1aXJlICcuL3RyYWNrJ1xuXG4jIHRoZXJlIGFyZSB0aHJlZSB0aW1lIHNjYWxlcyB0aGF0IHdlIGFyZSBjb25jZXJuZWQgd2l0aFxuI1xuIyAtIHNhbXBsZSByYXRlXG4jIHJ1bnMgYXQgNDQxMDAgaHosIG9uY2UgZm9yIGVhY2ggc2FtcGxlIG9mIGF1ZGlvIHdlIG91dHB1dC4gIEFueSBjb2RlIHJ1bm5pbmdcbiMgYXQgdGhpcyByYXRlIGhhcyBhIGhpZ2ggY29zdCwgc28gcGVyZm9ybWFuY2UgaXMgaW1wb3J0YW50IGhlcmVcbiNcbiMgLSB0aWNrIHJhdGVcbiMgVGlja3MgcnVuIGV2ZXJ5IG4gc2FtcGxlcywgZGVmaW5lZCB1c2luZyB0aGUgY2xvY2tSYXRpbyB2YXJpYWJsZS4gIFRoaXNcbiMgYWxsb3dzIHVzIHRvIGRvIHByb2Nlc3NpbmcgdGhhdCBuZWVkcyB0byBydW4gZnJlcXVlbnRseSwgYnV0IGlzIHRvbyBleHBlbnNpdmVcbiMgdG8gcnVuIGZvciBlYWNoIHNtYXBsZS4gIEZvciBleGFtcGxlLCB0aGlzIGlzIHRoZSB0aW1lIHJlc29sdXRpb24gYXQgd2hpY2hcbiMgd2UgdHJpZ2dlciBuZXcgbm90ZXMuXG4jXG4jIC0gZnJhbWUgcmF0ZVxuIyBUaGUgZnJhbWUgcmF0ZSBpcyB0aGUgc3BlZWQgYXQgd2hpY2ggd2UgdHJpZ2dlciBHVUkgdXBkYXRlcyBmb3IgdGhpbmdzIGxpa2VcbiMgbGV2ZWwgbWV0ZXJzIGFuZCBwbGF5YmFjayBwb3NpdGlvbi4gIHdlIGNvbnRpbnVlIHRvIHJ1biBmcmFtZSB1cGRhdGVzIHdoZXRoZXJcbiMgb24gbm90IGF1ZGlvIGlzIHBsYXlpbmdcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvbmdcblxuICAjIG51bWJlciBvZiBzYW1wbGVzIHRvIHByb2Nlc3MgYmV0d2VlbiB0aWNrc1xuICBjbG9ja1JhdGlvID0gNDQxXG5cbiAgIyByYXRlIGF0IHdoaWNoIGxldmVsIG1ldGVycyBkZWNheVxuICBtZXRlckRlY2F5ID0gMC4wNVxuXG4gIGNsaXAgPSAoc2FtcGxlKSAtPlxuICAgIE1hdGgubWF4KDAsIE1hdGgubWluKDIsIHNhbXBsZSArIDEpKSAtIDFcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbGFzdEJlYXQgPSAwXG5cbiAgICAjIGtlZXAgbXV0YWJsZSBzdGF0ZSBmb3IgYXVkaW8gcGxheWJhY2sgaGVyZSAtIHRoaXMgd2lsbCBzdG9yZSB0aGluZ3MgbGlrZVxuICAgICMgZmlsdGVyIG1lbW9yeSBhbmQgbWV0ZXIgbGV2ZWxzIHRoYXQgbmVlZCB0byBzdGF5IG91dHNpZGUgdGhlIG5vcm1hbCBjdXJzb3JcbiAgICAjIHN0cnVjdHVyZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgIEBzdGF0ZSA9IHt9XG5cbiAgICAjIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgc29uZyBkb2N1bWVudFxuICAgIEBzb25nID0gbnVsbFxuXG4gICAgIyBrZWVwIGEgbGlzdCBvZiB1bnByb2Nlc3NlZCBtaWRpIG1lc3NhZ2VzXG4gICAgQG1pZGlNZXNzYWdlcyA9IFtdXG5cbiAgdXBkYXRlOiAoc3RhdGUpIC0+XG4gICAgQHNvbmcgPSBzdGF0ZVxuXG4gIG1pZGk6IChtZXNzYWdlKSAtPlxuICAgIEBtaWRpTWVzc2FnZXMucHVzaCBtZXNzYWdlXG5cbiAgIyBmaWxsIGEgYnVmZmVyIGZ1bmN0aW9uXG4gIGJ1ZmZlcjogKHNpemUsIGluZGV4LCBzYW1wbGVSYXRlLCBjYikgLT5cbiAgICBhcnIgPSBuZXcgRmxvYXQzMkFycmF5IHNpemVcblxuICAgIGlmIEBzb25nP1xuICAgICAgZm9yIGkgaW4gWzAuLi5zaXplXVxuICAgICAgICBpaSA9IGkgKyBpbmRleFxuICAgICAgICB0ID0gaWkgLyBzYW1wbGVSYXRlXG4gICAgICAgIGFycltpXSA9IEBzYW1wbGUgdCwgaWlcblxuICAgIGNiIGFyci5idWZmZXJcblxuICAjIGNhbGxlZCBmb3IgZXZlcnkgc2FtcGxlIG9mIGF1ZGlvXG4gIHNhbXBsZTogKHRpbWUsIGkpID0+XG4gICAgQHRpY2sgdGltZSwgaSBpZiBpICUgY2xvY2tSYXRpbyBpcyAwXG5cbiAgICBjbGlwIEBzb25nLmxldmVsICogQHNvbmcudHJhY2tzLnJlZHVjZSgobWVtbywgdHJhY2spID0+XG4gICAgICBtZW1vICsgVHJhY2suc2FtcGxlIEBzdGF0ZSwgdHJhY2ssIHRpbWUsIGlcbiAgICAsIDApXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IGNsb2NrUmF0aW8gc2FtcGxlc1xuICB0aWNrOiAodGltZSwgaSkgPT5cbiAgICBicHMgPSBAc29uZy5icG0gLyA2MFxuICAgIGJlYXQgPSB0aW1lICogYnBzXG5cbiAgICBAc29uZy50cmFja3MuZm9yRWFjaCAodHJhY2ssIGkpID0+XG5cbiAgICAgICMgZm9yIG5vdyBzZW5kIG1pZGkgb25seSB0byB0aGUgZmlyc3QgdHJhY2sgLSBpbiB0aGUgZnV0dXJlIHdlIHNob3VsZFxuICAgICAgIyBhbGxvdyB0cmFja3MgdG8gYmUgYXJtZWQgZm9yIHJlY29yZGluZ1xuICAgICAgbWlkaU1lc3NhZ2VzID0gaWYgaSBpcyBAc29uZy5zZWxlY3RlZFRyYWNrIHRoZW4gQG1pZGlNZXNzYWdlcyBlbHNlIG51bGxcblxuICAgICAgVHJhY2sudGljayBAc3RhdGUsIHRyYWNrLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGksIGJlYXQsIEBsYXN0QmVhdCwgYnBzXG5cbiAgICBAbGFzdEJlYXQgPSBiZWF0XG5cbiAgIyBjYWxsZWQgcGVyaW9kaWNhbGx5IHRvIHBhc3MgaGlnaCBmcmVxdWVuY3kgZGF0YSB0byB0aGUgdWkuLiB0aGlzIHNob3VsZFxuICAjIGV2ZW50dWFsbHkgYmUgdXBkYXRlZCB0byBiYXNlIHRoZSBhbW91bnQgb2YgZGVjYXkgb24gdGhlIGFjdHVhbCBlbHBhc2VkIHRpbWVcbiAgcHJvY2Vzc0ZyYW1lOiAtPlxuICAgIGlmIEBzb25nPy50cmFja3M/XG4gICAgICAjIGFwcGx5IGRlY2F5IHRvIG1ldGVyIGxldmVsc1xuICAgICAgZm9yIHRyYWNrIGluIEBzb25nLnRyYWNrc1xuICAgICAgICBpZiBAc3RhdGVbdHJhY2suX2lkXT9cbiAgICAgICAgICBAc3RhdGVbdHJhY2suX2lkXS5tZXRlckxldmVsIC09IG1ldGVyRGVjYXlcblxuICAjIGdldCBhIHNlbmRhYmxlIHZlcnNpb24gb2YgY3VycmVudCBzb25nIHBsYXliYWNrIHN0YXRlXG4gIGdldFN0YXRlOiAtPlxuICAgIG1ldGVyTGV2ZWxzOiBAc29uZz8udHJhY2tzPy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtb1t0cmFjay5faWRdID0gQHN0YXRlW3RyYWNrLl9pZF0/Lm1ldGVyTGV2ZWxcbiAgICAgIG1lbW9cbiAgICAsIHt9KVxuIiwiaW5zdHJ1bWVudFR5cGVzID1cbiAgQW5hbG9nU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vYW5hbG9nX3N5bnRoZXNpemVyJ1xuICBCYXNpY1NhbXBsZXI6IHJlcXVpcmUgJy4vYmFzaWNfc2FtcGxlcidcbiAgRHJ1bVNhbXBsZXI6IHJlcXVpcmUgJy4vZHJ1bV9zYW1wbGVyJ1xuICBEcnVtU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vZHJ1bV9zeW50aGVzaXplcidcbiAgTG9vcFNhbXBsZXI6IHJlcXVpcmUgJy4vbG9vcF9zYW1wbGVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHJhY2tcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgc3RhdGVbdHJhY2suX2lkXSA9XG4gICAgICBtZXRlckxldmVsOiAwXG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCB0cmFjaykgLT5cbiAgICBkZWxldGUgc3RhdGVbdHJhY2suX2lkXVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGkpIC0+XG4gICAgIyBnZXQgaW5zdHJ1bWVudCBvdXRwdXRcbiAgICBJbnN0cnVtZW50ID0gaW5zdHJ1bWVudFR5cGVzW3RyYWNrLmluc3RydW1lbnQuX3R5cGVdXG4gICAgc2FtcGxlID0gSW5zdHJ1bWVudC5zYW1wbGUgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGlcblxuICAgICMgYXBwbHkgZWZmZWN0c1xuICAgIHNhbXBsZSA9IHRyYWNrLmVmZmVjdHMucmVkdWNlKChzYW1wbGUsIGVmZmVjdCkgLT5cbiAgICAgIEVmZmVjdC5zYW1wbGUgc3RhdGUsIGVmZmVjdCwgdGltZSwgaSwgc2FtcGxlXG4gICAgLCBzYW1wbGUpXG5cbiAgICAjIHVwZGF0ZSBtZXRlciBsZXZlbHNcbiAgICBpZiB0cmFja1N0YXRlID0gc3RhdGVbdHJhY2suX2lkXVxuICAgICAgbGV2ZWwgPSB0cmFja1N0YXRlLm1ldGVyTGV2ZWxcbiAgICAgIGlmIG5vdCBsZXZlbD8gb3IgaXNOYU4obGV2ZWwpIG9yIHNhbXBsZSA+IGxldmVsXG4gICAgICAgIHRyYWNrU3RhdGUubWV0ZXJMZXZlbCA9IHNhbXBsZVxuXG4gICAgc2FtcGxlXG5cbiAgQHRpY2s6IChzdGF0ZSwgdHJhY2ssIG1pZGlNZXNzYWdlcywgdGltZSwgaSwgYmVhdCwgbGFzdEJlYXQsIGJwcykgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIHRyYWNrIHVubGVzcyBzdGF0ZVt0cmFjay5faWRdP1xuXG4gICAgSW5zdHJ1bWVudCA9IGluc3RydW1lbnRUeXBlc1t0cmFjay5pbnN0cnVtZW50Ll90eXBlXVxuXG4gICAgIyBnZXQgbm90ZXMgb24gZnJvbSBzZXF1ZW5jZVxuICAgIHtub3Rlc09uLCBub3Rlc09mZn0gPSBAbm90ZXMgdHJhY2suc2VxdWVuY2UsIG1pZGlNZXNzYWdlcywgdGltZSwgYmVhdCwgbGFzdEJlYXRcblxuICAgIEluc3RydW1lbnQudGljayBzdGF0ZSwgdHJhY2suaW5zdHJ1bWVudCwgdGltZSwgaSwgYmVhdCwgYnBzLCBub3Rlc09uLCBub3Rlc09mZlxuICAgIHRyYWNrLmVmZmVjdHMuZm9yRWFjaCAoZSkgLT4gZS50aWNrIHN0YXRlLCB0aW1lLCBiZWF0LCBicHNcblxuICAjIGxvb2sgYXQgc2VxdWVuY2UgYW5kIG1pZGkgbWVzc2FnZXMsIHJldHVybiBhcnJheXMgb2Ygbm90ZXMgb24gYW5kIG9mZlxuICAjIG9jY3VycmluZyBpbiB0aGlzIHRpY2tcbiAgQG5vdGVzOiAoc2VxdWVuY2UsIG1pZGlNZXNzYWdlcywgdGltZSwgYmVhdCwgbGFzdEJlYXQpIC0+XG4gICAgYmFyID0gTWF0aC5mbG9vciBiZWF0IC8gc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmFyID0gTWF0aC5mbG9vciBsYXN0QmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgYmVhdCA9IGJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGxhc3RCZWF0ID0gbGFzdEJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuXG4gICAgbm90ZXNPbiA9IFtdXG4gICAgbm90ZXNPZmYgPSBbXVxuXG4gICAgZm9yIGlkLCBub3RlIG9mIHNlcXVlbmNlLm5vdGVzXG4gICAgICBzdGFydCA9IG5vdGUuc3RhcnRcbiAgICAgIGVuZCA9IG5vdGUuc3RhcnQgKyBub3RlLmxlbmd0aFxuICAgICAgaWYgc3RhcnQgPCBiZWF0IGFuZCAoc3RhcnQgPj0gbGFzdEJlYXQgb3IgYmFyID4gbGFzdEJhcilcbiAgICAgICAgbm90ZXNPbi5wdXNoIHtrZXk6IG5vdGUua2V5fVxuICAgICAgaWYgZW5kIDwgYmVhdCBhbmQgKGVuZCA+PSBsYXN0QmVhdCBvciBiYXIgPiBsYXN0QmFyKVxuICAgICAgICBub3Rlc09mZi5wdXNoIHtrZXk6IG5vdGUua2V5fVxuXG4gICAgaWYgbWlkaU1lc3NhZ2VzP1xuICAgICAgbWlkaU1lc3NhZ2VzLmZvckVhY2ggKG1lc3NhZ2UsIGkpIC0+XG4gICAgICAgIGlmIG1lc3NhZ2UudGltZSA8IHRpbWVcbiAgICAgICAgICBtaWRpTWVzc2FnZXMuc3BsaWNlIGksIDFcbiAgICAgICAgICBzd2l0Y2ggbWVzc2FnZS50eXBlXG4gICAgICAgICAgICB3aGVuICdvbidcbiAgICAgICAgICAgICAgbm90ZXNPbi5wdXNoIGtleTogbWVzc2FnZS5rZXlcbiAgICAgICAgICAgIHdoZW4gJ29mZidcbiAgICAgICAgICAgICAgbm90ZXNPZmYucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG5cbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9XG4iXX0=
