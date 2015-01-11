(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Song, song;

Song = require('./dsp/song.coffee');

song = new Song;

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



},{"./dsp/song.coffee":16}],2:[function(require,module,exports){
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
var Sequence;

module.exports = Sequence = (function() {
  function Sequence() {}

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

})();



},{}],16:[function(require,module,exports){
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
    return clip(this.data.level * this.data.tracks.reduce((function(_this) {
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
    var track, _i, _len, _ref, _ref1, _results;
    if (((_ref = this.data) != null ? _ref.tracks : void 0) != null) {
      _ref1 = this.data.tracks;
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
      meterLevels: (_ref = this.data) != null ? (_ref1 = _ref.tracks) != null ? _ref1.reduce((function(_this) {
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
var Sequence, Track, instrumentTypes;

Sequence = require('./sequence');

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

})();



},{"./analog_synthesizer":2,"./basic_sampler":3,"./drum_sampler":11,"./drum_synthesizer":12,"./loop_sampler":14,"./sequence":15}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9vc2NpbGxhdG9ycy5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9yaW5nX2J1ZmZlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2RydW1fc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvaW5zdHJ1bWVudC5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvbG9vcF9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9zZXF1ZW5jZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3Avc29uZy5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvdHJhY2suY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDV0EsSUFBQSxVQUFBOztBQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsbUJBQVIsQ0FBUCxDQUFBOztBQUFBLElBRUEsR0FBTyxHQUFBLENBQUEsSUFGUCxDQUFBOztBQUFBLElBS0ksQ0FBQyxTQUFMLEdBQWlCLFNBQUMsQ0FBRCxHQUFBO0FBQ2YsVUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQWQ7QUFBQSxTQUNPLFFBRFA7YUFFSSxJQUFJLENBQUMsTUFBTCxDQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBbkIsRUFGSjtBQUFBLFNBR08sUUFIUDthQUlJLElBQUksQ0FBQyxNQUFMLENBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFuQixFQUF5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QUF3QixJQUF4QixFQUE4QixRQUE5QixFQUF3QyxHQUF4QyxHQUFBO0FBQ0wsUUFBQSxtQkFBQTtBQUFBLElBQUEsSUFBaUMsd0JBQWpDO0FBQUEsTUFBQSxJQUFDLENBQUEsV0FBRCxDQUFhLEtBQWIsRUFBb0IsS0FBcEIsQ0FBQSxDQUFBO0tBQUE7QUFBQSxJQUVBLFVBQUEsR0FBYSxlQUFnQixDQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBakIsQ0FGN0IsQ0FBQTtBQUFBLElBR0EsT0FBQSxHQUFVLFFBQVEsQ0FBQyxPQUFULENBQWlCLEtBQUssQ0FBQyxRQUF2QixFQUFpQyxJQUFqQyxFQUF1QyxRQUF2QyxDQUhWLENBQUE7QUFBQSxJQUlBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEtBQWhCLEVBQXVCLEtBQUssQ0FBQyxVQUE3QixFQUF5QyxJQUF6QyxFQUErQyxDQUEvQyxFQUFrRCxJQUFsRCxFQUF3RCxHQUF4RCxFQUE2RCxPQUE3RCxDQUpBLENBQUE7V0FLQSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQWQsQ0FBc0IsU0FBQyxDQUFELEdBQUE7YUFBTyxDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsRUFBYyxJQUFkLEVBQW9CLElBQXBCLEVBQTBCLEdBQTFCLEVBQVA7SUFBQSxDQUF0QixFQU5LO0VBQUEsQ0F6QlAsQ0FBQTs7ZUFBQTs7SUFaRixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMgdGhpcyBzY3JpcHQgaXMgcnVuIGluc2lkZSBhIHdvcmtlciBpbiBvcmRlciB0byBkbyBhdWRpbyBwcm9jZXNzaW5nIG91dHNpZGUgb2ZcbiMgdGhlIG1haW4gdWkgdGhyZWFkLlxuI1xuIyBUaGUgd29ya2VyIHJlY2VpdmVzIHR3byB0eXBlcyBvZiBtZXNzYWdlcyAtICd1cGRhdGUnIHcvIHtkYXRhfSBjb250YWluaW5nIHRoZVxuIyBjdXJyZW50IHN0YXRlIG9mIHRoZSBzb25nIGRvY3VtZW50LCBhbmQgJ2J1ZmZlcicgdy8ge3NpemUsIGluZGV4LCBzYW1wbGVSYXRlfVxuIyByZXF1ZXN0aW5nIGEgYnVmZmVyIHRvIGJlIGZpbGxlZCBhbmQgc2VudCBiYWNrLlxuI1xuIyBJdCBhbHNvIHNlbmRzIHR3byB0eXBlcyBvZiBtZXNzYWdlcyAtICdmcmFtZScgbWVzc2FnZXMgYXQgNjBoeiBjb250YWluaW5nIHRoZVxuIyBjdXJyZW50IHBsYXliYWNrIHN0YXRlIGFzIHtmcmFtZX0sIGFuZCBzZW5kcyAnYnVmZmVyJyBtZXNzYWdlcyB0cmFuc2ZlcnJpbmdcbiMgZmlsbGVkIEFycmF5QnVmZmVycyBpbiByZXNwb25zZSB0byAnYnVmZmVyJyByZXF1ZXN0cy5cblxuU29uZyA9IHJlcXVpcmUgJy4vZHNwL3NvbmcuY29mZmVlJ1xuXG5zb25nID0gbmV3IFNvbmdcblxuIyByZXNwb25kIHRvIG1lc3NhZ2VzIGZyb20gcGFyZW50IHRocmVhZFxuc2VsZi5vbm1lc3NhZ2UgPSAoZSkgLT5cbiAgc3dpdGNoIGUuZGF0YS50eXBlXG4gICAgd2hlbiAndXBkYXRlJ1xuICAgICAgc29uZy51cGRhdGUgZS5kYXRhLnN0YXRlXG4gICAgd2hlbiAnYnVmZmVyJ1xuICAgICAgc29uZy5idWZmZXIgZS5kYXRhLnNpemUsIGUuZGF0YS5pbmRleCwgZS5kYXRhLnNhbXBsZVJhdGUsIChidWZmZXIpIC0+XG4gICAgICAgIHBvc3RNZXNzYWdlXG4gICAgICAgICAgdHlwZTogJ2J1ZmZlcidcbiAgICAgICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgICAsIFtidWZmZXJdXG5cbiMgdHJpZ2dlciBwcm9jZXNzaW5nIG9uIHNvbmcgYXQgZnJhbWUgcmF0ZSBhbmQgc2VuZCB1cGRhdGVzIHRvIHRoZSBwYXJlbnQgdGhyZWFkXG5zZXRJbnRlcnZhbCAtPlxuICBzb25nLnByb2Nlc3NGcmFtZSgpXG4gIHBvc3RNZXNzYWdlXG4gICAgdHlwZTogJ2ZyYW1lJ1xuICAgIGZyYW1lOiBzb25nLmdldFN0YXRlKClcbiwgMTAwMCAvIDYwXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxvd3Bhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbG93cGFzc19maWx0ZXInXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQW5hbG9nU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgdHVuZSA9IDQ0MFxuICBmcmVxdWVuY3kgPSAoa2V5KSAtPlxuICAgIHR1bmUgKiBNYXRoLnBvdyAyLCAoa2V5IC0gNjkpIC8gMTJcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdXBlciBzdGF0ZSwgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgciA9IE1hdGgubWF4IDAuMDEsIGluc3RydW1lbnQudm9sdW1lRW52LnJcbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlLmxlbiArIHIgPiB0aW1lIC0gbm90ZS50aW1lXG5cbiAgICAgICMgc3VtIG9zY2lsbGF0b3JzIGFuZCBhcHBseSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIG9zYzFGcmVxID0gZnJlcXVlbmN5IG5vdGUua2V5ICsgaW5zdHJ1bWVudC5vc2MxLnR1bmUgLSAwLjUgKyBNYXRoLnJvdW5kKDI0ICogKGluc3RydW1lbnQub3NjMS5waXRjaCAtIDAuNSkpXG4gICAgICBvc2MyRnJlcSA9IGZyZXF1ZW5jeSBub3RlLmtleSArIGluc3RydW1lbnQub3NjMi50dW5lIC0gMC41ICsgTWF0aC5yb3VuZCgyNCAqIChpbnN0cnVtZW50Lm9zYzIucGl0Y2ggLSAwLjUpKVxuICAgICAgc2FtcGxlID0gZW52ZWxvcGUoaW5zdHJ1bWVudC52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKFxuICAgICAgICBpbnN0cnVtZW50Lm9zYzEubGV2ZWwgKiBvc2NpbGxhdG9yc1tpbnN0cnVtZW50Lm9zYzEud2F2ZWZvcm1dKHRpbWUsIG9zYzFGcmVxKSArXG4gICAgICAgIGluc3RydW1lbnQub3NjMi5sZXZlbCAqIG9zY2lsbGF0b3JzW2luc3RydW1lbnQub3NjMi53YXZlZm9ybV0odGltZSwgb3NjMkZyZXEpXG4gICAgICApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xubG93cGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlcidcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQmFzaWNTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIEBkZWZhdWx0czpcbiAgICBfdHlwZTogJ0Jhc2ljU2FtcGxlcidcbiAgICBsZXZlbDogMC41XG4gICAgcGFuOiAwLjVcbiAgICBwb2x5cGhvbnk6IDFcbiAgICBtYXhQb2x5cGhvbnk6IDZcbiAgICByb290S2V5OiA2MFxuICAgIHNhbXBsZURhdGE6IG51bGxcbiAgICBzYW1wbGVOYW1lOiAnJ1xuICAgIHN0YXJ0OiAwLjNcbiAgICBsb29wQWN0aXZlOiAnbG9vcCdcbiAgICBsb29wOiAwLjdcbiAgICB0dW5lOiAwLjVcbiAgICB2b2x1bWVFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXJFbnY6XG4gICAgICBhOiAwXG4gICAgICBkOiAwLjI1XG4gICAgICBzOiAxXG4gICAgICByOiAwLjVcbiAgICBmaWx0ZXI6XG4gICAgICB0eXBlOiAnbm9uZSdcbiAgICAgIGZyZXE6IDAuMjdcbiAgICAgIHJlczogMC4wNVxuICAgICAgZW52OiAwLjQ1XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3VwZXIgc3RhdGUsIGluc3RydW1lbnRcblxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzID1cbiAgICAgIExQOiAobG93cGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgSFA6IChoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgbm9uZTogKCgoc2FtcGxlKSAtPiBzYW1wbGUpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuICAgIHJldHVybiAwIHVubGVzcyBpbnN0cnVtZW50LnNhbXBsZURhdGE/XG5cbiAgICByID0gTWF0aC5tYXggMC4wMSwgaW5zdHJ1bWVudC52b2x1bWVFbnYuclxuXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlcy5yZWR1Y2UoKG1lbW8sIG5vdGUsIGluZGV4KSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZS5sZW4gKyByID4gdGltZSAtIG5vdGUudGltZVxuXG4gICAgICAjIGdldCBwaXRjaCBzaGlmdGVkIGludGVycG9sYXRlZCBzYW1wbGUgYW5kIGFwcGx5IHZvbHVtZSBlbnZlbG9wZVxuICAgICAgdHJhbnNwb3NlID0gbm90ZS5rZXkgLSBpbnN0cnVtZW50LnJvb3RLZXkgKyBpbnN0cnVtZW50LnR1bmUgLSAwLjVcbiAgICAgIHNhbXBsZXNFbGFwc2VkID0gaSAtIG5vdGUuaVxuICAgICAgb2Zmc2V0ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50LnN0YXJ0ICogaW5zdHJ1bWVudC5zYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgbG9vcFBvaW50ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50Lmxvb3AgKiBpbnN0cnVtZW50LnNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3IgaW5zdHJ1bWVudC5zYW1wbGVEYXRhLCB0cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXQsIGluc3RydW1lbnQubG9vcEFjdGl2ZSA9PSAnbG9vcCcsIGxvb3BQb2ludFxuICAgICAgc2FtcGxlID0gZW52ZWxvcGUoaW5zdHJ1bWVudC52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKHNhbXBsZSBvciAwKVxuXG4gICAgICAjIGFwcGx5IGZpbHRlciB3aXRoIGVudmVsb3BlXG4gICAgICBjdXRvZmYgPSBNYXRoLm1pbiAxLCBpbnN0cnVtZW50LmZpbHRlci5mcmVxICsgaW5zdHJ1bWVudC5maWx0ZXIuZW52ICogZW52ZWxvcGUoaW5zdHJ1bWVudC5maWx0ZXJFbnYsIG5vdGUsIHRpbWUpXG4gICAgICBmaWx0ZXIgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tpbnN0cnVtZW50LmZpbHRlci50eXBlXVtpbmRleF1cbiAgICAgIHNhbXBsZSA9IGZpbHRlciBzYW1wbGUsIGN1dG9mZiwgaW5zdHJ1bWVudC5maWx0ZXIucmVzXG5cbiAgICAgICMgcmV0dXJuIHJlc3VsdFxuICAgICAgbWVtbyArIHNhbXBsZVxuXG4gICAgLCAwKVxuIiwibWluRW52VmFsdWUgPSAwLjAxXG5cbm1vZHVsZS5leHBvcnRzID0gKGVudiwgbm90ZSwgdGltZSkgLT5cblxuICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICBhID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5hXG4gIGQgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmRcbiAgcyA9IGVudi5zXG4gIHIgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LnJcblxuICAjIGF0dGFjaywgZGVjYXksIHN1c3RhaW5cbiAgbCA9IGlmIGVsYXBzZWQgPiBhICsgZFxuICAgIGwgPSBzXG4gIGVsc2UgaWYgZWxhcHNlZCA+IGFcbiAgICBsID0gcyArICgxIC0gcykgKiAoYSArIGQgLSBlbGFwc2VkKSAvIGRcbiAgZWxzZVxuICAgIGVsYXBzZWQgLyBhXG5cbiAgIyByZWxlYXNlXG4gIGlmIGVsYXBzZWQgPiBub3RlLmxlblxuICAgIGwgPSBsICogKHIgKyBub3RlLmxlbiAtIGVsYXBzZWQpIC8gclxuXG4gIE1hdGgubWF4IDAsIGxcbiIsInNhbXBsZVJhdGUgPSA0ODAwMFxubWF4RnJlcSA9IDEyMDAwXG5kYkdhaW4gPSAxMiAgICAjIGdhaW4gb2YgZmlsdGVyXG5iYW5kd2lkdGggPSAxICAjIGJhbmR3aWR0aCBpbiBvY3RhdmVzXG5cbiMgY29uc3RhbnRzXG5BID0gTWF0aC5wb3coMTAsIGRiR2FpbiAvIDQwKVxuZSA9IE1hdGgubG9nKDIpXG50YXUgPSAyICogTWF0aC5QSVxuYmV0YSA9IE1hdGguc3FydCgyICogQSlcblxuIyBoeXBlcmJvbGljIHNpbiBmdW5jdGlvblxuc2luaCA9ICh4KSAtPlxuICB5ID0gTWF0aC5leHAgeFxuICAoeSAtIDEgLyB5KSAvIDJcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBhMCA9IGExID0gYTIgPSBhMyA9IGE0ID0geDEgPSB4MiA9IHkxID0geTIgPSAwXG4gIGZyZXEgPSBvbWVnYSA9IHNuID0gYWxwaGEgPSAwXG4gIGNzID0gMVxuXG4gIGxhc3RDdXRvZmYgPSAwXG5cbiAgKHNhbXBsZSwgY3V0b2ZmKSAtPlxuICAgICMgY2FjaGUgZmlsdGVyIHZhbHVlcyB1bnRpbCBjdXRvZmYgY2hhbmdlc1xuICAgIGlmIGN1dG9mZiAhPSBsYXN0Q3V0b2ZmXG4gIFxuICAgICAgb2xkQ3V0b2ZmID0gY3V0b2ZmXG5cbiAgICAgIGZyZXEgPSBjdXRvZmYgKiBtYXhGcmVxXG4gICAgICBvbWVnYSA9IHRhdSAqIGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgICBzbiA9IE1hdGguc2luIG9tZWdhXG4gICAgICBjcyA9IE1hdGguY29zIG9tZWdhXG4gICAgICBhbHBoYSA9IHNuICogc2luaChlIC8gMiAqIGJhbmR3aWR0aCAqIG9tZWdhIC8gc24pXG5cbiAgICAgIGIwID0gKDEgKyBjcykgLyAyXG4gICAgICBiMSA9IC0oMSArIGNzKVxuICAgICAgYjIgPSAoMSArIGNzKSAvIDJcbiAgICAgIGFhMCA9IDEgKyBhbHBoYVxuICAgICAgYWExID0gLTIgKiBjc1xuICAgICAgYWEyID0gMSAtIGFscGhhXG5cbiAgICAgIGEwID0gYjAgLyBhYTBcbiAgICAgIGExID0gYjEgLyBhYTBcbiAgICAgIGEyID0gYjIgLyBhYTBcbiAgICAgIGEzID0gYWExIC8gYWEwXG4gICAgICBhNCA9IGFhMiAvIGFhMFxuXG4gICAgIyBjb21wdXRlIHJlc3VsdFxuICAgIHMgPSBNYXRoLm1heCAtMSwgTWF0aC5taW4gMSwgc2FtcGxlXG4gICAgcmVzdWx0ID0gYTAgKiBzICsgYTEgKiB4MSArIGEyICogeDIgLSBhMyAqIHkxIC0gYTQgKiB5MlxuXG4gICAgIyBzaGlmdCB4MSB0byB4Miwgc2FtcGxlIHRvIHgxXG4gICAgeDIgPSB4MVxuICAgIHgxID0gc1xuXG4gICAgIyBzaGlmdCB5MSB0byB5MiwgcmVzdWx0IHRvIHkxXG4gICAgeTIgPSB5MVxuICAgIHkxID0gcmVzdWx0XG5cbiAgICByZXN1bHQiLCJtb2R1bGUuZXhwb3J0cyA9IChzYW1wbGVEYXRhLCB0cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXQgPSAwLCBsb29wQWN0aXZlID0gZmFsc2UsIGxvb3BQb2ludCkgLT5cbiAgaSA9IHNhbXBsZXNFbGFwc2VkICogTWF0aC5wb3cgMiwgdHJhbnNwb3NlIC8gMTJcbiAgaTEgPSBNYXRoLmZsb29yIGlcbiAgaTEgPSBpMSAlIChsb29wUG9pbnQgLSBvZmZzZXQpIGlmIGxvb3BBY3RpdmVcbiAgaTIgPSBpMSArIDFcbiAgbCA9IGkgJSAxXG5cbiAgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMV0gKiAoMSAtIGwpICsgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMl0gKiBsIiwic2FtcGxlUmF0ZSA9IDQ4MDAwXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cblxuICB5MSA9IHkyID0geTMgPSB5NCA9IG9sZHggPSBvbGR5MSA9IG9sZHkyID0gb2xkeTMgPSAwXG4gIHAgPSBrID0gdDEgPSB0MiA9IHIgPSB4ID0gbnVsbFxuXG4gIChzYW1wbGUsIGN1dG9mZiwgcmVzKSAtPlxuICAgIGZyZXEgPSAyMCAqIE1hdGgucG93IDEwLCAzICogY3V0b2ZmXG4gICAgZnJlcSA9IGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgcCA9IGZyZXEgKiAoMS44IC0gKDAuOCAqIGZyZXEpKVxuICAgIGsgPSAyICogTWF0aC5zaW4oZnJlcSAqIE1hdGguUEkgLyAyKSAtIDFcbiAgICB0MSA9ICgxIC0gcCkgKiAxLjM4NjI0OVxuICAgIHQyID0gMTIgKyB0MSAqIHQxXG4gICAgciA9IHJlcyAqIDAuNTcgKiAodDIgKyA2ICogdDEpIC8gKHQyIC0gNiAqIHQxKVxuXG4gICAgeCA9IHNhbXBsZSAtIHIgKiB5NFxuXG4gICAgIyBmb3VyIGNhc2NhZGVkIG9uZS1wb2xlIGZpbHRlcnMgKGJpbGluZWFyIHRyYW5zZm9ybSlcbiAgICB5MSA9ICB4ICogcCArIG9sZHggICogcCAtIGsgKiB5MVxuICAgIHkyID0geTEgKiBwICsgb2xkeTEgKiBwIC0gayAqIHkyXG4gICAgeTMgPSB5MiAqIHAgKyBvbGR5MiAqIHAgLSBrICogeTNcbiAgICB5NCA9IHkzICogcCArIG9sZHkzICogcCAtIGsgKiB5NFxuXG4gICAgIyBjbGlwcGVyIGJhbmQgbGltaXRlZCBzaWdtb2lkXG4gICAgeTQgLT0gKHk0ICogeTQgKiB5NCkgLyA2XG5cbiAgICBvbGR4ID0geFxuICAgIG9sZHkxID0geTFcbiAgICBvbGR5MiA9IHkyXG4gICAgb2xkeTMgPSB5M1xuXG4gICAgeTQiLCJ0YXUgPSBNYXRoLlBJICogMlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgc2luZTogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICBNYXRoLnNpbiB0aW1lICogdGF1ICogZnJlcXVlbmN5XG5cbiAgc3F1YXJlOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIGlmICgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSA+IDAuNSB0aGVuIDEgZWxzZSAtMVxuXG4gIHNhdzogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICAxIC0gMiAqICgoKHRpbWUgJSAoMSAvIGZyZXF1ZW5jeSkpICogZnJlcXVlbmN5KSAlIDEpXG5cbiAgbm9pc2U6IC0+XG4gICAgMiAqIE1hdGgucmFuZG9tKCkgLSAxIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSaW5nQnVmZmVyXG4gIFxuICBjb25zdHJ1Y3RvcjogKEBtYXhMZW5ndGgsIEBUeXBlID0gRmxvYXQzMkFycmF5LCBAbGVuZ3RoKSAtPlxuICAgIEBsZW5ndGggfHw9IEBtYXhMZW5ndGhcbiAgICBAYXJyYXkgPSBuZXcgVHlwZSBAbWF4TGVuZ3RoXG4gICAgQHBvcyA9IDBcblxuICByZXNldDogLT5cbiAgICBAYXJyYXkgPSBuZXcgQFR5cGUgQG1heExlbmd0aFxuICAgIHRoaXNcblxuICByZXNpemU6IChAbGVuZ3RoKSAtPlxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPj0gQGxlbmd0aFxuXG4gIHB1c2g6IChlbCkgLT5cbiAgICBAYXJyYXlbQHBvc10gPSBlbFxuICAgIEBwb3MgKz0gMVxuICAgIEBwb3MgPSAwIGlmIEBwb3MgPT0gQGxlbmd0aFxuICAgIHRoaXNcblxuICBmb3JFYWNoOiAoZm4pIC0+XG4gICAgYHZhciBpLCBsZW47XG4gICAgZm9yIChpID0gdGhpcy5wb3MsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnBvczsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBmbih0aGlzLmFycmF5W2ldLCBpKTtcbiAgICB9YFxuICAgIHRoaXNcblxuICByZWR1Y2U6IChmbiwgbWVtbyA9IDApIC0+XG4gICAgQGZvckVhY2ggKGVsLCBpKSAtPlxuICAgICAgbWVtbyA9IGZuIG1lbW8sIGVsLCBpXG4gICAgbWVtb1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZGVjYXksIGVsYXBzZWQpIC0+XG4gIGlmIGVsYXBzZWQgPiBkZWNheVxuICAgIDBcbiAgZWxzZVxuICAgIDEgLSBlbGFwc2VkIC8gZGVjYXlcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJ1bVNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgIyBrZWVwIG5vdGVzIGluIGEgbWFwIHtrZXk6IG5vdGVEYXRhfSBpbnN0ZWFkIG9mIHRvIGEgcmluZyBidWZmZXJcbiAgIyB0aGlzIGdpdmVzIHVzIG9uZSBtb25waG9uaWMgdm9pY2UgcGVyIGRydW1cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID0gbm90ZXM6IHt9XG5cbiAgQHNhbXBsZTogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIGluc3RydW1lbnQuZHJ1bXMucmVkdWNlKChtZW1vLCBkcnVtKSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIGRydW0uc2FtcGxlRGF0YT9cblxuICAgICAgbm90ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tkcnVtLmtleV1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuXG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgZHJ1bS5zdGFydCAqIGRydW0uc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIHJldHVybiBtZW1vIGlmIHNhbXBsZXNFbGFwc2VkICsgb2Zmc2V0ID4gZHJ1bS5zYW1wbGVEYXRhLmxlbmd0aFxuXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3IgZHJ1bS5zYW1wbGVEYXRhLCBkcnVtLnRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldFxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnZlbG9wZShkcnVtLnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG4gICAgLCAwKVxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tub3RlLmtleV0gPSB7dGltZSwgaSwgbGVuOiBub3RlLmxlbmd0aCAvIGJwc31cbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5zaW1wbGVFbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUnXG5vc2NpbGxhdG9ycyA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9vc2NpbGxhdG9ycydcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERydW1TeW50aGVzaXplciBleHRlbmRzIEluc3RydW1lbnRcblxuICBtaW5GcmVxID0gNjBcbiAgbWF4RnJlcSA9IDMwMDBcbiAgZnJlcVNjYWxlID0gbWF4RnJlcSAtIG1pbkZyZXFcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgaW4gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bS5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiB7fVxuICAgICAgZmlsdGVyczogKFxuICAgICAgICBoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uMTI3XVxuICAgICAgKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgICAgIHJldHVybiBtZW1vIGlmIGVsYXBzZWQgPiBkcnVtLmRlY2F5XG5cbiAgICAgIGVudiA9IHNpbXBsZUVudmVsb3BlIGRydW0uZGVjYXksIGVsYXBzZWRcbiAgICAgIGZyZXEgPSBtaW5GcmVxICsgZHJ1bS5waXRjaCAqIGZyZXFTY2FsZVxuXG4gICAgICAjIGFwcGx5IHBpdGNoIGJlbmRcbiAgICAgIGlmIGRydW0uYmVuZFxuICAgICAgICBmcmVxID0gKDIgLSBkcnVtLmJlbmQgKyBkcnVtLmJlbmQgKiBlbnYpIC8gMiAqIGZyZXFcblxuICAgICAgIyBhcHBseSBmbVxuICAgICAgaWYgZHJ1bS5mbSA+IDBcbiAgICAgICAgc2lnbmFsID0gb3NjaWxsYXRvcnMuc2luZSBlbGFwc2VkLCBtaW5GcmVxICsgZHJ1bS5mbUZyZXEgKiBmcmVxU2NhbGVcbiAgICAgICAgZnJlcSArPSBkcnVtLmZtICogc2lnbmFsICogc2ltcGxlRW52ZWxvcGUoZHJ1bS5mbURlY2F5ICsgMC4wMSwgZWxhcHNlZClcblxuICAgICAgIyBzdW0gbm9pc2UgYW5kIG9zY2lsbGF0b3JcbiAgICAgIHNhbXBsZSA9IChcbiAgICAgICAgKDEgLSBkcnVtLm5vaXNlKSAqIG9zY2lsbGF0b3JzLnNpbmUoZWxhcHNlZCwgZnJlcSkgK1xuICAgICAgICBkcnVtLm5vaXNlICogb3NjaWxsYXRvcnMubm9pc2UoKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGhpZ2hwYXNzXG4gICAgICBpZiBkcnVtLmhwID4gMFxuICAgICAgICBzYW1wbGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tkcnVtLmtleV0gc2FtcGxlLCBkcnVtLmhwXG5cbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ICogc2FtcGxlXG5cbiAgICAsIDApXG5cblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24pIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbbm90ZS5rZXldID0ge3RpbWUsIGksIGxlbjogbm90ZS5sZW5ndGggLyBicHN9XG5cbiIsIlJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnN0cnVtZW50XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiBuZXcgUmluZ0J1ZmZlciBpbnN0cnVtZW50Lm1heFBvbHlwaG9ueSwgQXJyYXksIGluc3RydW1lbnQucG9seXBob255XG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIGRlbGV0ZSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF1cblxuICBAc2FtcGxlOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgMFxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cbiAgICBpbnN0cnVtZW50U3RhdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF1cblxuICAgIGlmIGluc3RydW1lbnQucG9seXBob255ICE9IGluc3RydW1lbnRTdGF0ZS5ub3Rlcy5sZW5ndGhcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3Rlcy5yZXNpemUgaW5zdHJ1bWVudC5wb2x5cGhvbnlcblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3Rlcy5wdXNoKFxuICAgICAgICB7dGltZSwgaSwga2V5OiBub3RlLmtleSwgbGVuOiBub3RlLmxlbmd0aCAvIGJwc31cbiAgICAgIClcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTG9vcFNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlcXVlbmNlXG5cbiAgQG5vdGVzT246IChzZXF1ZW5jZSwgYmVhdCwgbGFzdEJlYXQpIC0+XG4gICAgYmFyID0gTWF0aC5mbG9vciBiZWF0IC8gc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmFyID0gTWF0aC5mbG9vciBsYXN0QmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgYmVhdCA9IGJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGxhc3RCZWF0ID0gbGFzdEJlYXQgJSBzZXF1ZW5jZS5sb29wU2l6ZVxuXG4gICAgcmVzdWx0ID0gW11cbiAgICBmb3IgaWQsIG5vdGUgb2Ygc2VxdWVuY2Uubm90ZXNcbiAgICAgIGlmIG5vdGUuc3RhcnQgPCBiZWF0IGFuZCAobm90ZS5zdGFydCA+PSBsYXN0QmVhdCBvciBiYXIgPiBsYXN0QmFyKVxuICAgICAgICByZXN1bHQucHVzaCBub3RlXG5cbiAgICByZXN1bHRcbiIsIlRyYWNrID0gcmVxdWlyZSAnLi90cmFjaydcblxuIyB0aGVyZSBhcmUgdGhyZWUgdGltZSBzY2FsZXMgdGhhdCB3ZSBhcmUgY29uY2VybmVkIHdpdGhcbiNcbiMgLSBzYW1wbGUgcmF0ZVxuIyBydW5zIGF0IDQ0MTAwIGh6LCBvbmNlIGZvciBlYWNoIHNhbXBsZSBvZiBhdWRpbyB3ZSBvdXRwdXQuICBBbnkgY29kZSBydW5uaW5nXG4jIGF0IHRoaXMgcmF0ZSBoYXMgYSBoaWdoIGNvc3QsIHNvIHBlcmZvcm1hbmNlIGlzIGltcG9ydGFudCBoZXJlXG4jXG4jIC0gdGljayByYXRlXG4jIFRpY2tzIHJ1biBldmVyeSBuIHNhbXBsZXMsIGRlZmluZWQgdXNpbmcgdGhlIGNsb2NrUmF0aW8gdmFyaWFibGUuICBUaGlzXG4jIGFsbG93cyB1cyB0byBkbyBwcm9jZXNzaW5nIHRoYXQgbmVlZHMgdG8gcnVuIGZyZXF1ZW50bHksIGJ1dCBpcyB0b28gZXhwZW5zaXZlXG4jIHRvIHJ1biBmb3IgZWFjaCBzbWFwbGUuICBGb3IgZXhhbXBsZSwgdGhpcyBpcyB0aGUgdGltZSByZXNvbHV0aW9uIGF0IHdoaWNoXG4jIHdlIHRyaWdnZXIgbmV3IG5vdGVzLlxuI1xuIyAtIGZyYW1lIHJhdGVcbiMgVGhlIGZyYW1lIHJhdGUgaXMgdGhlIHNwZWVkIGF0IHdoaWNoIHdlIHRyaWdnZXIgR1VJIHVwZGF0ZXMgZm9yIHRoaW5ncyBsaWtlXG4jIGxldmVsIG1ldGVycyBhbmQgcGxheWJhY2sgcG9zaXRpb24uICB3ZSBjb250aW51ZSB0byBydW4gZnJhbWUgdXBkYXRlcyB3aGV0aGVyXG4jIG9uIG5vdCBhdWRpbyBpcyBwbGF5aW5nXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb25nXG5cbiAgIyBudW1iZXIgb2Ygc2FtcGxlcyB0byBwcm9jZXNzIGJldHdlZW4gdGlja3NcbiAgY2xvY2tSYXRpbyA9IDQ0MVxuXG4gICMgcmF0ZSBhdCB3aGljaCBsZXZlbCBtZXRlcnMgZGVjYXlcbiAgbWV0ZXJEZWNheSA9IDAuMDVcblxuICBjbGlwID0gKHNhbXBsZSkgLT5cbiAgICBNYXRoLm1heCgwLCBNYXRoLm1pbigyLCBzYW1wbGUgKyAxKSkgLSAxXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGxhc3RCZWF0ID0gMFxuXG4gICAgIyBrZWVwIG11dGFibGUgc3RhdGUgZm9yIGF1ZGlvIHBsYXliYWNrIGhlcmUgLSB0aGlzIHdpbGwgc3RvcmUgdGhpbmdzIGxpa2VcbiAgICAjIGZpbHRlciBtZW1vcnkgYW5kIG1ldGVyIGxldmVscyB0aGF0IG5lZWQgdG8gc3RheSBvdXRzaWRlIHRoZSBub3JtYWwgY3Vyc29yXG4gICAgIyBzdHJ1Y3R1cmUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcbiAgICBAc3RhdGUgPSB7fVxuXG4gICAgIyBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHNvbmcgZG9jdW1lbnRcbiAgICBAZGF0YSA9IG51bGxcblxuICB1cGRhdGU6IChkYXRhKSAtPlxuICAgIEBkYXRhID0gZGF0YVxuXG4gICMgZmlsbCBhIGJ1ZmZlciBmdW5jdGlvblxuICBidWZmZXI6IChzaXplLCBpbmRleCwgc2FtcGxlUmF0ZSwgY2IpIC0+XG4gICAgYXJyID0gbmV3IEZsb2F0MzJBcnJheSBzaXplXG5cbiAgICBpZiBAZGF0YT9cbiAgICAgIGZvciBpIGluIFswLi4uc2l6ZV1cbiAgICAgICAgaWkgPSBpICsgaW5kZXhcbiAgICAgICAgdCA9IGlpIC8gc2FtcGxlUmF0ZVxuICAgICAgICBhcnJbaV0gPSBAc2FtcGxlIHQsIGlpXG5cbiAgICBjYiBhcnIuYnVmZmVyXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IHNhbXBsZSBvZiBhdWRpb1xuICBzYW1wbGU6ICh0aW1lLCBpKSA9PlxuICAgIEB0aWNrIHRpbWUsIGkgaWYgaSAlIGNsb2NrUmF0aW8gaXMgMFxuXG4gICAgY2xpcCBAZGF0YS5sZXZlbCAqIEBkYXRhLnRyYWNrcy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtbyArIFRyYWNrLnNhbXBsZSBAc3RhdGUsIHRyYWNrLCB0aW1lLCBpXG4gICAgLCAwKVxuXG4gICMgY2FsbGVkIGZvciBldmVyeSBjbG9ja1JhdGlvIHNhbXBsZXNcbiAgdGljazogKHRpbWUsIGkpID0+XG4gICAgYnBzID0gQGRhdGEuYnBtIC8gNjBcbiAgICBiZWF0ID0gdGltZSAqIGJwc1xuXG4gICAgQGRhdGEudHJhY2tzLmZvckVhY2ggKHRyYWNrKSA9PlxuICAgICAgVHJhY2sudGljayBAc3RhdGUsIHRyYWNrLCB0aW1lLCBpLCBiZWF0LCBAbGFzdEJlYXQsIGJwc1xuXG4gICAgQGxhc3RCZWF0ID0gYmVhdFxuXG4gICMgY2FsbGVkIHBlcmlvZGljYWxseSB0byBwYXNzIGhpZ2ggZnJlcXVlbmN5IGRhdGEgdG8gdGhlIHVpLi4gdGhpcyBzaG91bGRcbiAgIyBldmVudHVhbGx5IGJlIHVwZGF0ZWQgdG8gYmFzZSB0aGUgYW1vdW50IG9mIGRlY2F5IG9uIHRoZSBhY3R1YWwgZWxwYXNlZCB0aW1lXG4gIHByb2Nlc3NGcmFtZTogLT5cbiAgICBpZiBAZGF0YT8udHJhY2tzP1xuICAgICAgIyBhcHBseSBkZWNheSB0byBtZXRlciBsZXZlbHNcbiAgICAgIGZvciB0cmFjayBpbiBAZGF0YS50cmFja3NcbiAgICAgICAgaWYgQHN0YXRlW3RyYWNrLl9pZF0/XG4gICAgICAgICAgQHN0YXRlW3RyYWNrLl9pZF0ubWV0ZXJMZXZlbCAtPSBtZXRlckRlY2F5XG5cbiAgIyBnZXQgYSBzZW5kYWJsZSB2ZXJzaW9uIG9mIGN1cnJlbnQgc29uZyBwbGF5YmFjayBzdGF0ZVxuICBnZXRTdGF0ZTogLT5cbiAgICBtZXRlckxldmVsczogQGRhdGE/LnRyYWNrcz8ucmVkdWNlKChtZW1vLCB0cmFjaykgPT5cbiAgICAgIG1lbW9bdHJhY2suX2lkXSA9IEBzdGF0ZVt0cmFjay5faWRdPy5tZXRlckxldmVsXG4gICAgICBtZW1vXG4gICAgLCB7fSlcbiIsIlNlcXVlbmNlID0gcmVxdWlyZSAnLi9zZXF1ZW5jZSdcblxuaW5zdHJ1bWVudFR5cGVzID1cbiAgQW5hbG9nU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vYW5hbG9nX3N5bnRoZXNpemVyJ1xuICBCYXNpY1NhbXBsZXI6IHJlcXVpcmUgJy4vYmFzaWNfc2FtcGxlcidcbiAgRHJ1bVNhbXBsZXI6IHJlcXVpcmUgJy4vZHJ1bV9zYW1wbGVyJ1xuICBEcnVtU3ludGhlc2l6ZXI6IHJlcXVpcmUgJy4vZHJ1bV9zeW50aGVzaXplcidcbiAgTG9vcFNhbXBsZXI6IHJlcXVpcmUgJy4vbG9vcF9zYW1wbGVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHJhY2tcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgc3RhdGVbdHJhY2suX2lkXSA9XG4gICAgICBtZXRlckxldmVsOiAwXG5cbiAgQHJlbGVhc2VTdGF0ZTogKHN0YXRlLCB0cmFjaykgLT5cbiAgICBkZWxldGUgc3RhdGVbdHJhY2suX2lkXVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGkpIC0+XG4gICAgIyBnZXQgaW5zdHJ1bWVudCBvdXRwdXRcbiAgICBJbnN0cnVtZW50ID0gaW5zdHJ1bWVudFR5cGVzW3RyYWNrLmluc3RydW1lbnQuX3R5cGVdXG4gICAgc2FtcGxlID0gSW5zdHJ1bWVudC5zYW1wbGUgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGlcblxuICAgICMgYXBwbHkgZWZmZWN0c1xuICAgIHNhbXBsZSA9IHRyYWNrLmVmZmVjdHMucmVkdWNlKChzYW1wbGUsIGVmZmVjdCkgLT5cbiAgICAgIEVmZmVjdC5zYW1wbGUgc3RhdGUsIGVmZmVjdCwgdGltZSwgaSwgc2FtcGxlXG4gICAgLCBzYW1wbGUpXG5cbiAgICAjIHVwZGF0ZSBtZXRlciBsZXZlbHNcbiAgICBpZiB0cmFja1N0YXRlID0gc3RhdGVbdHJhY2suX2lkXVxuICAgICAgbGV2ZWwgPSB0cmFja1N0YXRlLm1ldGVyTGV2ZWxcbiAgICAgIGlmIG5vdCBsZXZlbD8gb3IgaXNOYU4obGV2ZWwpIG9yIHNhbXBsZSA+IGxldmVsXG4gICAgICAgIHRyYWNrU3RhdGUubWV0ZXJMZXZlbCA9IHNhbXBsZVxuXG4gICAgc2FtcGxlXG5cbiAgQHRpY2s6IChzdGF0ZSwgdHJhY2ssIHRpbWUsIGksIGJlYXQsIGxhc3RCZWF0LCBicHMpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCB0cmFjayB1bmxlc3Mgc3RhdGVbdHJhY2suX2lkXT9cblxuICAgIEluc3RydW1lbnQgPSBpbnN0cnVtZW50VHlwZXNbdHJhY2suaW5zdHJ1bWVudC5fdHlwZV1cbiAgICBub3Rlc09uID0gU2VxdWVuY2Uubm90ZXNPbiB0cmFjay5zZXF1ZW5jZSwgYmVhdCwgbGFzdEJlYXRcbiAgICBJbnN0cnVtZW50LnRpY2sgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPblxuICAgIHRyYWNrLmVmZmVjdHMuZm9yRWFjaCAoZSkgLT4gZS50aWNrIHN0YXRlLCB0aW1lLCBiZWF0LCBicHNcbiJdfQ==
