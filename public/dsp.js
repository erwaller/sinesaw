(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Song;

Song = require('./dsp/song.coffee');

self.song = new Song;

self.logSample = require('./dsp/components/log_sample');

self.onmessage = function(e) {
  switch (e.data.type) {
    case 'buffer':
      return song.buffer(e.data.size, e.data.index, e.data.sampleRate, function(buffer) {
        return postMessage({
          type: 'buffer',
          buffer: buffer
        }, [buffer]);
      });
    case 'update':
      return song.update(e.data.state);
    case 'midi':
      return song.midi(e.data.message);
    case 'addSample':
      return song.addSample(e.data.id, e.data.sampleData);
    case 'removeSample':
      return song.removeSample(e.data.id);
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

  AnalogSynthesizer.sample = function(state, samples, instrument, time, i) {
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

  BasicSampler.sample = function(state, samples, instrument, time, i) {
    var r, sampleData;
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    sampleData = samples[instrument.sampleId];
    if (sampleData == null) {
      return 0;
    }
    r = Math.max(0.01, instrument.volumeEnv.r);
    return instrument.level * state[instrument._id].notes.reduce((function(_this) {
      return function(memo, note, index) {
        var cutoff, filter, loopActive, loopPoint, offset, sample, samplesElapsed, transpose;
        if (note == null) {
          return memo;
        }
        if (time > r + note.timeOff) {
          return memo;
        }
        transpose = note.key - instrument.rootKey + instrument.tune - 0.5;
        samplesElapsed = i - note.i;
        offset = Math.floor(instrument.start * sampleData.length);
        loopActive = instrument.loopActive === 'loop';
        loopPoint = Math.floor(instrument.loop * sampleData.length);
        sample = linearInterpolator(sampleData, transpose, samplesElapsed, offset, loopActive, loopPoint);
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

  DrumSampler.sample = function(state, samples, instrument, time, i) {
    if (instrument.level === 0) {
      return 0;
    }
    if (state[instrument._id] == null) {
      return 0;
    }
    return instrument.level * instrument.drums.reduce((function(_this) {
      return function(memo, drum) {
        var note, offset, sample, sampleData, samplesElapsed;
        note = state[instrument._id].notes[drum.key];
        if (note == null) {
          return memo;
        }
        sampleData = samples[drum.sampleId];
        if (sampleData == null) {
          return memo;
        }
        samplesElapsed = i - note.i;
        offset = Math.floor(drum.start * sampleData.length);
        if (samplesElapsed + offset > sampleData.length) {
          return memo;
        }
        sample = linearInterpolator(sampleData, drum.transpose, samplesElapsed, offset);
        return memo + drum.level * envelope(drum.volumeEnv, note, time) * (sample || 0);
      };
    })(this), 0);
  };

  DrumSampler.tick = function(state, instrument, time, i, beat, bps, notesOn, notesOff) {
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    notesOff.forEach(function(_arg) {
      var key, _ref;
      key = _arg.key;
      return (_ref = state[instrument._id].notes[key]) != null ? _ref.timeOff = time : void 0;
    });
    return notesOn.forEach((function(_this) {
      return function(note) {
        return state[instrument._id].notes[note.key] = {
          time: time,
          i: i
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

  DrumSynthesizer.sample = function(state, samples, instrument, time, i) {
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

  DrumSynthesizer.tick = function(state, instrument, time, i, beat, bps, notesOn, notesOff) {
    if (state[instrument._id] == null) {
      this.createState(state, instrument);
    }
    return notesOn.forEach((function(_this) {
      return function(note) {
        return state[instrument._id].notes[note.key] = {
          time: time,
          i: i
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

  Instrument.sample = function(state, samples, instrument, time, i) {
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
      var key, _ref;
      key = _arg.key;
      return (_ref = instrumentState.noteMap[key]) != null ? _ref.timeOff = time : void 0;
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

  clockRatio = 110;

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
    this.samples = {};
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
        ii = index + i;
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
        return memo + Track.sample(_this.state, _this.samples, track, time, i);
      };
    })(this), 0));
  };

  Song.prototype.tick = function(time, i) {
    var beat, bps;
    bps = this.song.bpm / 60;
    beat = time * bps;
    this.song.tracks.forEach((function(_this) {
      return function(track, index) {
        var midiMessages;
        midiMessages = index === _this.song.selectedTrack ? _this.midiMessages : null;
        return Track.tick(_this.state, track, midiMessages, time, i, beat, _this.lastBeat, bps);
      };
    })(this));
    return this.lastBeat = beat;
  };

  Song.prototype.addSample = function(id, sampleData) {
    return this.samples[id] = sampleData;
  };

  Song.prototype.removeSample = function(id) {
    return delete this.samples[id];
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

  Track.sample = function(state, samples, track, time, i) {
    var Instrument, level, sample, trackState;
    Instrument = instrumentTypes[track.instrument._type];
    sample = Instrument.sample(state, samples, track.instrument, time, i);
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
      } else if (bar > lastBar && end === sequence.loopSize) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL29zY2lsbGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3JpbmdfYnVmZmVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9kcnVtX3N5bnRoZXNpemVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9pbnN0cnVtZW50LmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9sb29wX3NhbXBsZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3NvbmcuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3RyYWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1lBLElBQUEsSUFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLG1CQUFSLENBQVAsQ0FBQTs7QUFBQSxJQUVJLENBQUMsSUFBTCxHQUFZLEdBQUEsQ0FBQSxJQUZaLENBQUE7O0FBQUEsSUFJSSxDQUFDLFNBQUwsR0FBaUIsT0FBQSxDQUFRLDZCQUFSLENBSmpCLENBQUE7O0FBQUEsSUFPSSxDQUFDLFNBQUwsR0FBaUIsU0FBQyxDQUFELEdBQUE7QUFDZixVQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBZDtBQUFBLFNBQ08sUUFEUDthQUVJLElBQUksQ0FBQyxNQUFMLENBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFu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QVUsQ0FBVixHQUFBO0FBQ25CLFFBQUEsSUFBRyxPQUFPLENBQUMsSUFBUixHQUFlLElBQWxCO0FBQ0UsVUFBQSxZQUFZLENBQUMsTUFBYixDQUFvQixDQUFwQixFQUF1QixDQUF2QixDQUFBLENBQUE7QUFDQSxrQkFBTyxPQUFPLENBQUMsSUFBZjtBQUFBLGlCQUNPLElBRFA7cUJBRUksT0FBTyxDQUFDLElBQVIsQ0FBYTtBQUFBLGdCQUFBLEdBQUEsRUFBSyxPQUFPLENBQUMsR0FBYjtlQUFiLEVBRko7QUFBQSxpQkFHTyxLQUhQO3FCQUlJLFFBQVEsQ0FBQyxJQUFULENBQWM7QUFBQSxnQkFBQSxHQUFBLEVBQUssT0FBTyxDQUFDLEdBQWI7ZUFBZCxFQUpKO0FBQUEsV0FGRjtTQURtQjtNQUFBLENBQXJCLENBQUEsQ0FERjtLQXhCQTtXQWtDQTtBQUFBLE1BQUMsU0FBQSxPQUFEO0FBQUEsTUFBVSxVQUFBLFFBQVY7TUFuQ007RUFBQSxDQXRDUixDQUFBOztlQUFBOztJQVZGLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyB0aGlzIHNjcmlwdCBpcyBydW4gaW5zaWRlIGEgd29ya2VyIGluIG9yZGVyIHRvIGRvIGF1ZGlvIHByb2Nlc3Npbmcgb3V0c2lkZSBvZlxuIyB0aGUgbWFpbiB1aSB0aHJlYWQuXG4jXG4jIFRoZSB3b3JrZXIgcmVjZWl2ZXMgdGhyZWUgdHlwZXMgb2YgbWVzc2FnZXMgLSAndXBkYXRlJyB3LyB7c3RhdGV9IGNvbnRhaW5pbmdcbiMgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHNvbmcsICdtaWRpJyB3LyB7bWVzc2FnZX0gY29udGFpbmluZyBpbmNvbWluZyBub3RlT25cbiMgYW5kIG5vdGVPZmYgbWVzc2FnZXMsIGFuZCAnYnVmZmVyJyB3LyB7c2l6ZSwgaW5kZXgsIHNhbXBsZVJhdGV9IHJlcXVlc3RpbmdcbiMgYSBidWZmZXIgdG8gYmUgZmlsbGVkIGFuZCBzZW50IGJhY2suXG4jXG4jIEl0IGFsc28gc2VuZHMgdHdvIHR5cGVzIG9mIG1lc3NhZ2VzIC0gJ2ZyYW1lJyBtZXNzYWdlcyBhdCA2MGh6IGNvbnRhaW5pbmcgdGhlXG4jIGN1cnJlbnQgcGxheWJhY2sgc3RhdGUgYXMge2ZyYW1lfSwgYW5kIHNlbmRzICdidWZmZXInIG1lc3NhZ2VzIHRyYW5zZmVycmluZ1xuIyBmaWxsZWQgQXJyYXlCdWZmZXJzIGluIHJlc3BvbnNlIHRvICdidWZmZXInIHJlcXVlc3RzLlxuXG5Tb25nID0gcmVxdWlyZSAnLi9kc3Avc29uZy5jb2ZmZWUnXG5cbnNlbGYuc29uZyA9IG5ldyBTb25nXG5cbnNlbGYubG9nU2FtcGxlID0gcmVxdWlyZSAnLi9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlJ1xuXG4jIHJlc3BvbmQgdG8gbWVzc2FnZXMgZnJvbSBwYXJlbnQgdGhyZWFkXG5zZWxmLm9ubWVzc2FnZSA9IChlKSAtPlxuICBzd2l0Y2ggZS5kYXRhLnR5cGVcbiAgICB3aGVuICdidWZmZXInXG4gICAgICBzb25nLmJ1ZmZlciBlLmRhdGEuc2l6ZSwgZS5kYXRhLmluZGV4LCBlLmRhdGEuc2FtcGxlUmF0ZSwgKGJ1ZmZlcikgLT5cbiAgICAgICAgcG9zdE1lc3NhZ2VcbiAgICAgICAgICB0eXBlOiAnYnVmZmVyJ1xuICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyXG4gICAgICAgICwgW2J1ZmZlcl1cbiAgICB3aGVuICd1cGRhdGUnXG4gICAgICBzb25nLnVwZGF0ZSBlLmRhdGEuc3RhdGVcbiAgICB3aGVuICdtaWRpJ1xuICAgICAgc29uZy5taWRpIGUuZGF0YS5tZXNzYWdlXG4gICAgd2hlbiAnYWRkU2FtcGxlJ1xuICAgICAgc29uZy5hZGRTYW1wbGUgZS5kYXRhLmlkLCBlLmRhdGEuc2FtcGxlRGF0YVxuICAgIHdoZW4gJ3JlbW92ZVNhbXBsZSdcbiAgICAgIHNvbmcucmVtb3ZlU2FtcGxlIGUuZGF0YS5pZFxuXG4jIHRyaWdnZXIgcHJvY2Vzc2luZyBvbiBzb25nIGF0IGZyYW1lIHJhdGUgYW5kIHNlbmQgdXBkYXRlcyB0byB0aGUgcGFyZW50IHRocmVhZFxuc2V0SW50ZXJ2YWwgLT5cbiAgc29uZy5wcm9jZXNzRnJhbWUoKVxuICBwb3N0TWVzc2FnZVxuICAgIHR5cGU6ICdmcmFtZSdcbiAgICBmcmFtZTogc29uZy5nZXRTdGF0ZSgpXG4sIDEwMDAgLyA2MFxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcblJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5sb3dwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyJ1xuaGlnaHBhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvaGlnaHBhc3NfZmlsdGVyJ1xuZW52ZWxvcGUgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvZW52ZWxvcGUnXG5vc2NpbGxhdG9ycyA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9vc2NpbGxhdG9ycydcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEFuYWxvZ1N5bnRoZXNpemVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIHR1bmUgPSA0NDBcbiAgZnJlcXVlbmN5ID0gKGtleSkgLT5cbiAgICB0dW5lICogTWF0aC5wb3cgMiwgKGtleSAtIDY5KSAvIDEyXG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3VwZXIgc3RhdGUsIGluc3RydW1lbnRcblxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzID1cbiAgICAgIExQOiAobG93cGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgSFA6IChoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgbm9uZTogKCgoc2FtcGxlKSAtPiBzYW1wbGUpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgc2FtcGxlcywgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgciA9IE1hdGgubWF4IDAuMDEsIGluc3RydW1lbnQudm9sdW1lRW52LnJcblxuICAgICMgc3VtIGFsbCBhY3RpdmUgbm90ZXNcbiAgICBpbnN0cnVtZW50LmxldmVsICogc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzLnJlZHVjZSgobWVtbywgbm90ZSwgaW5kZXgpID0+XG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cbiAgICAgIHJldHVybiBtZW1vIGlmIHRpbWUgPiByICsgbm90ZS50aW1lT2ZmXG5cbiAgICAgICMgc3VtIG9zY2lsbGF0b3JzIGFuZCBhcHBseSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIG9zYzFGcmVxID0gZnJlcXVlbmN5IG5vdGUua2V5ICsgaW5zdHJ1bWVudC5vc2MxLnR1bmUgLSAwLjUgKyBNYXRoLnJvdW5kKDI0ICogKGluc3RydW1lbnQub3NjMS5waXRjaCAtIDAuNSkpXG4gICAgICBvc2MyRnJlcSA9IGZyZXF1ZW5jeSBub3RlLmtleSArIGluc3RydW1lbnQub3NjMi50dW5lIC0gMC41ICsgTWF0aC5yb3VuZCgyNCAqIChpbnN0cnVtZW50Lm9zYzIucGl0Y2ggLSAwLjUpKVxuICAgICAgc2FtcGxlID0gZW52ZWxvcGUoaW5zdHJ1bWVudC52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKFxuICAgICAgICBpbnN0cnVtZW50Lm9zYzEubGV2ZWwgKiBvc2NpbGxhdG9yc1tpbnN0cnVtZW50Lm9zYzEud2F2ZWZvcm1dKHRpbWUsIG9zYzFGcmVxKSArXG4gICAgICAgIGluc3RydW1lbnQub3NjMi5sZXZlbCAqIG9zY2lsbGF0b3JzW2luc3RydW1lbnQub3NjMi53YXZlZm9ybV0odGltZSwgb3NjMkZyZXEpXG4gICAgICApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxpbmVhckludGVycG9sYXRvciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9saW5lYXJfaW50ZXJwb2xhdG9yJ1xubG93cGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9sb3dwYXNzX2ZpbHRlcidcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQmFzaWNTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN1cGVyIHN0YXRlLCBpbnN0cnVtZW50XG5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVycyA9XG4gICAgICBMUDogKGxvd3Bhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIEhQOiAoaGlnaHBhc3NGaWx0ZXIoKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcbiAgICAgIG5vbmU6ICgoKHNhbXBsZSkgLT4gc2FtcGxlKSBmb3IgaSBpbiBbMC4uLmluc3RydW1lbnQubWF4UG9seXBob255XSlcblxuICBAc2FtcGxlOiAoc3RhdGUsIHNhbXBsZXMsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgIHNhbXBsZURhdGEgPSBzYW1wbGVzW2luc3RydW1lbnQuc2FtcGxlSWRdXG4gICAgcmV0dXJuIDAgdW5sZXNzIHNhbXBsZURhdGE/XG5cbiAgICByID0gTWF0aC5tYXggMC4wMSwgaW5zdHJ1bWVudC52b2x1bWVFbnYuclxuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXMucmVkdWNlKChtZW1vLCBub3RlLCBpbmRleCkgPT5cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuICAgICAgcmV0dXJuIG1lbW8gaWYgdGltZSA+IHIgKyBub3RlLnRpbWVPZmZcblxuICAgICAgIyBnZXQgcGl0Y2ggc2hpZnRlZCBpbnRlcnBvbGF0ZWQgc2FtcGxlIGFuZCBhcHBseSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIHRyYW5zcG9zZSA9IG5vdGUua2V5IC0gaW5zdHJ1bWVudC5yb290S2V5ICsgaW5zdHJ1bWVudC50dW5lIC0gMC41XG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgaW5zdHJ1bWVudC5zdGFydCAqIHNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBsb29wQWN0aXZlID0gaW5zdHJ1bWVudC5sb29wQWN0aXZlIGlzICdsb29wJ1xuICAgICAgbG9vcFBvaW50ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50Lmxvb3AgKiBzYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgc2FtcGxlID0gbGluZWFySW50ZXJwb2xhdG9yIHNhbXBsZURhdGEsIHRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldCwgbG9vcEFjdGl2ZSwgbG9vcFBvaW50XG4gICAgICBzYW1wbGUgPSBlbnZlbG9wZShpbnN0cnVtZW50LnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG5cbiAgICAgICMgYXBwbHkgZmlsdGVyIHdpdGggZW52ZWxvcGVcbiAgICAgIGN1dG9mZiA9IE1hdGgubWluIDEsIGluc3RydW1lbnQuZmlsdGVyLmZyZXEgKyBpbnN0cnVtZW50LmZpbHRlci5lbnYgKiBlbnZlbG9wZShpbnN0cnVtZW50LmZpbHRlckVudiwgbm90ZSwgdGltZSlcbiAgICAgIGZpbHRlciA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2luc3RydW1lbnQuZmlsdGVyLnR5cGVdW2luZGV4XVxuICAgICAgc2FtcGxlID0gZmlsdGVyIHNhbXBsZSwgY3V0b2ZmLCBpbnN0cnVtZW50LmZpbHRlci5yZXNcblxuICAgICAgIyByZXR1cm4gcmVzdWx0XG4gICAgICBtZW1vICsgc2FtcGxlXG5cbiAgICAsIDApXG4iLCJtaW5FbnZWYWx1ZSA9IDAuMDFcblxubW9kdWxlLmV4cG9ydHMgPSAoZW52LCBub3RlLCB0aW1lKSAtPlxuICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICBhID0gTWF0aC5tYXggbWluRW52VmFsdWUsIGVudi5hXG4gIGQgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmRcbiAgcyA9IGVudi5zXG4gIHIgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LnJcblxuICAjIGF0dGFjaywgZGVjYXksIHN1c3RhaW5cbiAgbCA9IGlmIGVsYXBzZWQgPiBhICsgZFxuICAgIGwgPSBzXG4gIGVsc2UgaWYgZWxhcHNlZCA+IGFcbiAgICBsID0gcyArICgxIC0gcykgKiAoYSArIGQgLSBlbGFwc2VkKSAvIGRcbiAgZWxzZVxuICAgIGVsYXBzZWQgLyBhXG5cbiAgIyByZWxlYXNlXG4gIGlmIG5vdGUudGltZU9mZlxuICAgIGwgPSBsICogKG5vdGUudGltZU9mZiArIHIgLSB0aW1lKSAvIHJcblxuICBNYXRoLm1heCAwLCBsXG4iLCJzYW1wbGVSYXRlID0gNDgwMDBcbm1heEZyZXEgPSAxMjAwMFxuZGJHYWluID0gMTIgICAgIyBnYWluIG9mIGZpbHRlclxuYmFuZHdpZHRoID0gMSAgIyBiYW5kd2lkdGggaW4gb2N0YXZlc1xuXG4jIGNvbnN0YW50c1xuQSA9IE1hdGgucG93KDEwLCBkYkdhaW4gLyA0MClcbmUgPSBNYXRoLmxvZygyKVxudGF1ID0gMiAqIE1hdGguUElcbmJldGEgPSBNYXRoLnNxcnQoMiAqIEEpXG5cbiMgaHlwZXJib2xpYyBzaW4gZnVuY3Rpb25cbnNpbmggPSAoeCkgLT5cbiAgeSA9IE1hdGguZXhwIHhcbiAgKHkgLSAxIC8geSkgLyAyXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgYTAgPSBhMSA9IGEyID0gYTMgPSBhNCA9IHgxID0geDIgPSB5MSA9IHkyID0gMFxuICBmcmVxID0gb21lZ2EgPSBzbiA9IGFscGhhID0gMFxuICBjcyA9IDFcblxuICBsYXN0Q3V0b2ZmID0gMFxuXG4gIChzYW1wbGUsIGN1dG9mZikgLT5cbiAgICAjIGNhY2hlIGZpbHRlciB2YWx1ZXMgdW50aWwgY3V0b2ZmIGNoYW5nZXNcbiAgICBpZiBjdXRvZmYgIT0gbGFzdEN1dG9mZlxuICBcbiAgICAgIG9sZEN1dG9mZiA9IGN1dG9mZlxuXG4gICAgICBmcmVxID0gY3V0b2ZmICogbWF4RnJlcVxuICAgICAgb21lZ2EgPSB0YXUgKiBmcmVxIC8gc2FtcGxlUmF0ZVxuICAgICAgc24gPSBNYXRoLnNpbiBvbWVnYVxuICAgICAgY3MgPSBNYXRoLmNvcyBvbWVnYVxuICAgICAgYWxwaGEgPSBzbiAqIHNpbmgoZSAvIDIgKiBiYW5kd2lkdGggKiBvbWVnYSAvIHNuKVxuXG4gICAgICBiMCA9ICgxICsgY3MpIC8gMlxuICAgICAgYjEgPSAtKDEgKyBjcylcbiAgICAgIGIyID0gKDEgKyBjcykgLyAyXG4gICAgICBhYTAgPSAxICsgYWxwaGFcbiAgICAgIGFhMSA9IC0yICogY3NcbiAgICAgIGFhMiA9IDEgLSBhbHBoYVxuXG4gICAgICBhMCA9IGIwIC8gYWEwXG4gICAgICBhMSA9IGIxIC8gYWEwXG4gICAgICBhMiA9IGIyIC8gYWEwXG4gICAgICBhMyA9IGFhMSAvIGFhMFxuICAgICAgYTQgPSBhYTIgLyBhYTBcblxuICAgICMgY29tcHV0ZSByZXN1bHRcbiAgICBzID0gTWF0aC5tYXggLTEsIE1hdGgubWluIDEsIHNhbXBsZVxuICAgIHJlc3VsdCA9IGEwICogcyArIGExICogeDEgKyBhMiAqIHgyIC0gYTMgKiB5MSAtIGE0ICogeTJcblxuICAgICMgc2hpZnQgeDEgdG8geDIsIHNhbXBsZSB0byB4MVxuICAgIHgyID0geDFcbiAgICB4MSA9IHNcblxuICAgICMgc2hpZnQgeTEgdG8geTIsIHJlc3VsdCB0byB5MVxuICAgIHkyID0geTFcbiAgICB5MSA9IHJlc3VsdFxuXG4gICAgcmVzdWx0IiwibW9kdWxlLmV4cG9ydHMgPSAoc2FtcGxlRGF0YSwgdHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0ID0gMCwgbG9vcEFjdGl2ZSA9IGZhbHNlLCBsb29wUG9pbnQpIC0+XG4gIGkgPSBzYW1wbGVzRWxhcHNlZCAqIE1hdGgucG93IDIsIHRyYW5zcG9zZSAvIDEyXG4gIGkxID0gTWF0aC5mbG9vciBpXG4gIGkxID0gaTEgJSAobG9vcFBvaW50IC0gb2Zmc2V0KSBpZiBsb29wQWN0aXZlXG4gIGkyID0gaTEgKyAxXG4gIGwgPSBpICUgMVxuXG4gIHNhbXBsZURhdGFbb2Zmc2V0ICsgaTFdICogKDEgLSBsKSArIHNhbXBsZURhdGFbb2Zmc2V0ICsgaTJdICogbCIsImkgPSAwXG5tb2R1bGUuZXhwb3J0cyA9ICh2KSAtPlxuICBjb25zb2xlLmxvZyh2KSBpZiBpID09IDBcbiAgaSA9IChpICsgMSkgJSA3MDAwXG4iLCJzYW1wbGVSYXRlID0gNDgwMDBcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuXG4gIHkxID0geTIgPSB5MyA9IHk0ID0gb2xkeCA9IG9sZHkxID0gb2xkeTIgPSBvbGR5MyA9IDBcbiAgcCA9IGsgPSB0MSA9IHQyID0gciA9IHggPSBudWxsXG5cbiAgKHNhbXBsZSwgY3V0b2ZmLCByZXMpIC0+XG4gICAgZnJlcSA9IDIwICogTWF0aC5wb3cgMTAsIDMgKiBjdXRvZmZcbiAgICBmcmVxID0gZnJlcSAvIHNhbXBsZVJhdGVcbiAgICBwID0gZnJlcSAqICgxLjggLSAoMC44ICogZnJlcSkpXG4gICAgayA9IDIgKiBNYXRoLnNpbihmcmVxICogTWF0aC5QSSAvIDIpIC0gMVxuICAgIHQxID0gKDEgLSBwKSAqIDEuMzg2MjQ5XG4gICAgdDIgPSAxMiArIHQxICogdDFcbiAgICByID0gcmVzICogMC41NyAqICh0MiArIDYgKiB0MSkgLyAodDIgLSA2ICogdDEpXG5cbiAgICB4ID0gc2FtcGxlIC0gciAqIHk0XG5cbiAgICAjIGZvdXIgY2FzY2FkZWQgb25lLXBvbGUgZmlsdGVycyAoYmlsaW5lYXIgdHJhbnNmb3JtKVxuICAgIHkxID0gIHggKiBwICsgb2xkeCAgKiBwIC0gayAqIHkxXG4gICAgeTIgPSB5MSAqIHAgKyBvbGR5MSAqIHAgLSBrICogeTJcbiAgICB5MyA9IHkyICogcCArIG9sZHkyICogcCAtIGsgKiB5M1xuICAgIHk0ID0geTMgKiBwICsgb2xkeTMgKiBwIC0gayAqIHk0XG5cbiAgICAjIGNsaXBwZXIgYmFuZCBsaW1pdGVkIHNpZ21vaWRcbiAgICB5NCAtPSAoeTQgKiB5NCAqIHk0KSAvIDZcblxuICAgIG9sZHggPSB4XG4gICAgb2xkeTEgPSB5MVxuICAgIG9sZHkyID0geTJcbiAgICBvbGR5MyA9IHkzXG5cbiAgICB5NCIsInRhdSA9IE1hdGguUEkgKiAyXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBzaW5lOiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIE1hdGguc2luIHRpbWUgKiB0YXUgKiBmcmVxdWVuY3lcblxuICBzcXVhcmU6ICh0aW1lLCBmcmVxdWVuY3kpIC0+XG4gICAgaWYgKCh0aW1lICUgKDEgLyBmcmVxdWVuY3kpKSAqIGZyZXF1ZW5jeSkgJSAxID4gMC41IHRoZW4gMSBlbHNlIC0xXG5cbiAgc2F3OiAodGltZSwgZnJlcXVlbmN5KSAtPlxuICAgIDEgLSAyICogKCgodGltZSAlICgxIC8gZnJlcXVlbmN5KSkgKiBmcmVxdWVuY3kpICUgMSlcblxuICBub2lzZTogLT5cbiAgICAyICogTWF0aC5yYW5kb20oKSAtIDEiLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJpbmdCdWZmZXJcbiAgXG4gIGNvbnN0cnVjdG9yOiAoQG1heExlbmd0aCwgQFR5cGUgPSBGbG9hdDMyQXJyYXksIEBsZW5ndGgpIC0+XG4gICAgQGxlbmd0aCB8fD0gQG1heExlbmd0aFxuICAgIEBhcnJheSA9IG5ldyBUeXBlIEBtYXhMZW5ndGhcbiAgICBAcG9zID0gMFxuXG4gIHJlc2V0OiAtPlxuICAgIEBhcnJheSA9IG5ldyBAVHlwZSBAbWF4TGVuZ3RoXG4gICAgdGhpc1xuXG4gIHJlc2l6ZTogKEBsZW5ndGgpIC0+XG4gICAgQHBvcyA9IDAgaWYgQHBvcyA+PSBAbGVuZ3RoXG5cbiAgcHVzaDogKGVsKSAtPlxuICAgIEBhcnJheVtAcG9zXSA9IGVsXG4gICAgQHBvcyArPSAxXG4gICAgQHBvcyA9IDAgaWYgQHBvcyA9PSBAbGVuZ3RoXG4gICAgdGhpc1xuXG4gIGZvckVhY2g6IChmbikgLT5cbiAgICBgdmFyIGksIGxlbjtcbiAgICBmb3IgKGkgPSB0aGlzLnBvcywgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgZm4odGhpcy5hcnJheVtpXSwgaSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMucG9zOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICAgIH1gXG4gICAgdGhpc1xuXG4gIHJlZHVjZTogKGZuLCBtZW1vID0gMCkgLT5cbiAgICBAZm9yRWFjaCAoZWwsIGkpIC0+XG4gICAgICBtZW1vID0gZm4gbWVtbywgZWwsIGlcbiAgICBtZW1vXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChkZWNheSwgZWxhcHNlZCkgLT5cbiAgaWYgZWxhcHNlZCA+IGRlY2F5XG4gICAgMFxuICBlbHNlXG4gICAgMSAtIGVsYXBzZWQgLyBkZWNheVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcbmVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2VudmVsb3BlJ1xubGluZWFySW50ZXJwb2xhdG9yID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xpbmVhcl9pbnRlcnBvbGF0b3InXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcnVtU2FtcGxlciBleHRlbmRzIEluc3RydW1lbnRcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgdG8gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bVxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPSBub3Rlczoge31cblxuICBAc2FtcGxlOiAoc3RhdGUsIHNhbXBsZXMsIGluc3RydW1lbnQsIHRpbWUsIGkpIC0+XG4gICAgcmV0dXJuIDAgaWYgaW5zdHJ1bWVudC5sZXZlbCBpcyAwXG4gICAgcmV0dXJuIDAgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cblxuICAgICMgc3VtIGFsbCBhY3RpdmUgbm90ZXNcbiAgICBpbnN0cnVtZW50LmxldmVsICogaW5zdHJ1bWVudC5kcnVtcy5yZWR1Y2UoKG1lbW8sIGRydW0pID0+XG4gICAgICBub3RlID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW2RydW0ua2V5XVxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG5cbiAgICAgIHNhbXBsZURhdGEgPSBzYW1wbGVzW2RydW0uc2FtcGxlSWRdXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgc2FtcGxlRGF0YT9cblxuICAgICAgc2FtcGxlc0VsYXBzZWQgPSBpIC0gbm90ZS5pXG4gICAgICBvZmZzZXQgPSBNYXRoLmZsb29yIGRydW0uc3RhcnQgKiBzYW1wbGVEYXRhLmxlbmd0aFxuICAgICAgcmV0dXJuIG1lbW8gaWYgc2FtcGxlc0VsYXBzZWQgKyBvZmZzZXQgPiBzYW1wbGVEYXRhLmxlbmd0aFxuXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3Igc2FtcGxlRGF0YSwgZHJ1bS50cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXRcbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ZWxvcGUoZHJ1bS52b2x1bWVFbnYsIG5vdGUsIHRpbWUpICogKHNhbXBsZSBvciAwKVxuICAgICwgMClcblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24sIG5vdGVzT2ZmKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgbm90ZXNPZmYuZm9yRWFjaCAoe2tleX0pIC0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNba2V5XT8udGltZU9mZiA9IHRpbWVcblxuICAgIG5vdGVzT24uZm9yRWFjaCAobm90ZSkgPT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tub3RlLmtleV0gPSB7dGltZSwgaX1cbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5zaW1wbGVFbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9zaW1wbGVfZW52ZWxvcGUnXG5vc2NpbGxhdG9ycyA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9vc2NpbGxhdG9ycydcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERydW1TeW50aGVzaXplciBleHRlbmRzIEluc3RydW1lbnRcblxuICBtaW5GcmVxID0gNjBcbiAgbWF4RnJlcSA9IDMwMDBcbiAgZnJlcVNjYWxlID0gbWF4RnJlcSAtIG1pbkZyZXFcblxuICAjIGtlZXAgbm90ZXMgaW4gYSBtYXAge2tleTogbm90ZURhdGF9IGluc3RlYWQgb2YgaW4gYSByaW5nIGJ1ZmZlclxuICAjIHRoaXMgZ2l2ZXMgdXMgb25lIG1vbnBob25pYyB2b2ljZSBwZXIgZHJ1bS5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiB7fVxuICAgICAgZmlsdGVyczogKFxuICAgICAgICBoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uMTI3XVxuICAgICAgKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgc2FtcGxlcywgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgZWxhcHNlZCA9IHRpbWUgLSBub3RlLnRpbWVcbiAgICAgIHJldHVybiBtZW1vIGlmIGVsYXBzZWQgPiBkcnVtLmRlY2F5XG5cbiAgICAgIGVudiA9IHNpbXBsZUVudmVsb3BlIGRydW0uZGVjYXksIGVsYXBzZWRcbiAgICAgIGZyZXEgPSBtaW5GcmVxICsgZHJ1bS5waXRjaCAqIGZyZXFTY2FsZVxuXG4gICAgICAjIGFwcGx5IHBpdGNoIGJlbmRcbiAgICAgIGlmIGRydW0uYmVuZFxuICAgICAgICBmcmVxID0gKDIgLSBkcnVtLmJlbmQgKyBkcnVtLmJlbmQgKiBlbnYpIC8gMiAqIGZyZXFcblxuICAgICAgIyBhcHBseSBmbVxuICAgICAgaWYgZHJ1bS5mbSA+IDBcbiAgICAgICAgc2lnbmFsID0gb3NjaWxsYXRvcnMuc2luZSBlbGFwc2VkLCBtaW5GcmVxICsgZHJ1bS5mbUZyZXEgKiBmcmVxU2NhbGVcbiAgICAgICAgZnJlcSArPSBkcnVtLmZtICogc2lnbmFsICogc2ltcGxlRW52ZWxvcGUoZHJ1bS5mbURlY2F5ICsgMC4wMSwgZWxhcHNlZClcblxuICAgICAgIyBzdW0gbm9pc2UgYW5kIG9zY2lsbGF0b3JcbiAgICAgIHNhbXBsZSA9IChcbiAgICAgICAgKDEgLSBkcnVtLm5vaXNlKSAqIG9zY2lsbGF0b3JzLnNpbmUoZWxhcHNlZCwgZnJlcSkgK1xuICAgICAgICBkcnVtLm5vaXNlICogb3NjaWxsYXRvcnMubm9pc2UoKVxuICAgICAgKVxuXG4gICAgICAjIGFwcGx5IGhpZ2hwYXNzXG4gICAgICBpZiBkcnVtLmhwID4gMFxuICAgICAgICBzYW1wbGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0uZmlsdGVyc1tkcnVtLmtleV0gc2FtcGxlLCBkcnVtLmhwXG5cbiAgICAgIG1lbW8gKyBkcnVtLmxldmVsICogZW52ICogc2FtcGxlXG5cbiAgICAsIDApXG5cblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24sIG5vdGVzT2ZmKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgbm90ZXNPbi5mb3JFYWNoIChub3RlKSA9PlxuICAgICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW25vdGUua2V5XSA9IHt0aW1lLCBpfVxuXG4iLCJSaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW5zdHJ1bWVudFxuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXSA9XG4gICAgICBub3RlczogbmV3IFJpbmdCdWZmZXIgaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnksIEFycmF5LCBpbnN0cnVtZW50LnBvbHlwaG9ueVxuICAgICAgbm90ZU1hcDoge31cblxuICBAcmVsZWFzZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgZGVsZXRlIHN0YXRlW2luc3RydW1lbnQuX2lkXVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgc2FtcGxlcywgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICAwXG5cbiAgQHRpY2s6IChzdGF0ZSwgaW5zdHJ1bWVudCwgdGltZSwgaSwgYmVhdCwgYnBzLCBub3Rlc09uLCBub3Rlc09mZikgLT5cbiAgICBAY3JlYXRlU3RhdGUgc3RhdGUsIGluc3RydW1lbnQgdW5sZXNzIHN0YXRlW2luc3RydW1lbnQuX2lkXT9cbiAgICBpbnN0cnVtZW50U3RhdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF1cblxuICAgIGlmIGluc3RydW1lbnQucG9seXBob255ICE9IGluc3RydW1lbnRTdGF0ZS5ub3Rlcy5sZW5ndGhcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3Rlcy5yZXNpemUgaW5zdHJ1bWVudC5wb2x5cGhvbnlcblxuICAgIG5vdGVzT2ZmLmZvckVhY2ggKHtrZXl9KSAtPlxuICAgICAgIyBjb25zb2xlLmxvZyAnbm90ZSBvZmYgJyArIGtleVxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVNYXBba2V5XT8udGltZU9mZiA9IHRpbWVcblxuICAgIG5vdGVzT24uZm9yRWFjaCAoe2tleX0pIC0+XG4gICAgICAjIGNvbnNvbGUubG9nICdub3RlIG9uICcgKyBrZXlcbiAgICAgIGluc3RydW1lbnRTdGF0ZS5ub3RlTWFwW2tleV0gPSB7dGltZSwgaSwga2V5fVxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVzLnB1c2ggaW5zdHJ1bWVudFN0YXRlLm5vdGVNYXBba2V5XVxuXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvb3BTYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuIiwiVHJhY2sgPSByZXF1aXJlICcuL3RyYWNrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvbmdcblxuICAjIG51bWJlciBvZiBzYW1wbGVzIHRvIHByb2Nlc3MgYmV0d2VlbiB0aWNrc1xuICBjbG9ja1JhdGlvID0gMTEwXG5cbiAgIyByYXRlIGF0IHdoaWNoIGxldmVsIG1ldGVycyBkZWNheVxuICBtZXRlckRlY2F5ID0gMC4wNVxuXG4gIGNsaXAgPSAoc2FtcGxlKSAtPlxuICAgIE1hdGgubWF4KDAsIE1hdGgubWluKDIsIHNhbXBsZSArIDEpKSAtIDFcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbGFzdEJlYXQgPSAwXG5cbiAgICAjIGtlZXAgbXV0YWJsZSBzdGF0ZSBmb3IgYXVkaW8gcGxheWJhY2sgaGVyZSAtIHRoaXMgd2lsbCBzdG9yZSB0aGluZ3MgbGlrZVxuICAgICMgZmlsdGVyIG1lbW9yeSBhbmQgbWV0ZXIgbGV2ZWxzIHRoYXQgbmVlZCB0byBzdGF5IG91dHNpZGUgdGhlIG5vcm1hbCBjdXJzb3JcbiAgICAjIHN0cnVjdHVyZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgIEBzdGF0ZSA9IHt9XG5cbiAgICAjIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgc29uZyBkb2N1bWVudFxuICAgIEBzb25nID0gbnVsbFxuXG4gICAgIyBrZWVwIHJlZmVyZW5jZXMgdG8gdGhlIGN1cnJlbnRseSB1c2VkIHNhbXBsZXNcbiAgICBAc2FtcGxlcyA9IHt9XG5cbiAgICAjIGtlZXAgYSBsaXN0IG9mIHVucHJvY2Vzc2VkIG1pZGkgbWVzc2FnZXNcbiAgICBAbWlkaU1lc3NhZ2VzID0gW11cblxuICB1cGRhdGU6IChzdGF0ZSkgLT5cbiAgICBAc29uZyA9IHN0YXRlXG5cbiAgbWlkaTogKG1lc3NhZ2UpIC0+XG4gICAgQG1pZGlNZXNzYWdlcy5wdXNoIG1lc3NhZ2VcblxuICAjIGZpbGwgYSBidWZmZXIgZnVuY3Rpb25cbiAgYnVmZmVyOiAoc2l6ZSwgaW5kZXgsIHNhbXBsZVJhdGUsIGNiKSAtPlxuICAgIGFyciA9IG5ldyBGbG9hdDMyQXJyYXkgc2l6ZVxuXG4gICAgaWYgQHNvbmc/XG4gICAgICBmb3IgaSBpbiBbMC4uLnNpemVdXG4gICAgICAgIGlpID0gaW5kZXggKyBpXG4gICAgICAgIHQgPSBpaSAvIHNhbXBsZVJhdGVcbiAgICAgICAgYXJyW2ldID0gQHNhbXBsZSB0LCBpaVxuXG4gICAgY2IgYXJyLmJ1ZmZlclxuXG4gICMgY2FsbGVkIGZvciBldmVyeSBzYW1wbGUgb2YgYXVkaW9cbiAgc2FtcGxlOiAodGltZSwgaSkgPT5cbiAgICBAdGljayB0aW1lLCBpIGlmIGkgJSBjbG9ja1JhdGlvIGlzIDBcblxuICAgIGNsaXAgQHNvbmcubGV2ZWwgKiBAc29uZy50cmFja3MucmVkdWNlKChtZW1vLCB0cmFjaykgPT5cbiAgICAgIG1lbW8gKyBUcmFjay5zYW1wbGUgQHN0YXRlLCBAc2FtcGxlcywgdHJhY2ssIHRpbWUsIGlcbiAgICAsIDApXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IGNsb2NrUmF0aW8gc2FtcGxlc1xuICB0aWNrOiAodGltZSwgaSkgPT5cbiAgICBicHMgPSBAc29uZy5icG0gLyA2MFxuICAgIGJlYXQgPSB0aW1lICogYnBzXG5cbiAgICBAc29uZy50cmFja3MuZm9yRWFjaCAodHJhY2ssIGluZGV4KSA9PlxuXG4gICAgICAjIGZvciBub3cgc2VuZCBtaWRpIG9ubHkgdG8gdGhlIGZpcnN0IHRyYWNrIC0gaW4gdGhlIGZ1dHVyZSB3ZSBzaG91bGRcbiAgICAgICMgYWxsb3cgdHJhY2tzIHRvIGJlIGFybWVkIGZvciByZWNvcmRpbmdcbiAgICAgIG1pZGlNZXNzYWdlcyA9IGlmIGluZGV4IGlzIEBzb25nLnNlbGVjdGVkVHJhY2sgdGhlbiBAbWlkaU1lc3NhZ2VzIGVsc2UgbnVsbFxuXG4gICAgICBUcmFjay50aWNrIEBzdGF0ZSwgdHJhY2ssIG1pZGlNZXNzYWdlcywgdGltZSwgaSwgYmVhdCwgQGxhc3RCZWF0LCBicHNcblxuICAgIEBsYXN0QmVhdCA9IGJlYXRcblxuICAjIHN0b3JlIHNhbXBsZSBkYXRhIGZvciBhIG5ldyBzYW1wbGVcbiAgYWRkU2FtcGxlOiAoaWQsIHNhbXBsZURhdGEpIC0+XG4gICAgQHNhbXBsZXNbaWRdID0gc2FtcGxlRGF0YVxuXG4gICMgcmVsZWFzZSBkYXRhIGZvciBhIHNhbXBsZVxuICByZW1vdmVTYW1wbGU6IChpZCkgLT5cbiAgICBkZWxldGUgQHNhbXBsZXNbaWRdXG5cbiAgIyBjYWxsZWQgcGVyaW9kaWNhbGx5IHRvIHBhc3MgaGlnaCBmcmVxdWVuY3kgZGF0YSB0byB0aGUgdWkuLiB0aGlzIHNob3VsZFxuICAjIGV2ZW50dWFsbHkgYmUgdXBkYXRlZCB0byBiYXNlIHRoZSBhbW91bnQgb2YgZGVjYXkgb24gdGhlIGFjdHVhbCBlbHBhc2VkIHRpbWVcbiAgcHJvY2Vzc0ZyYW1lOiAtPlxuICAgIGlmIEBzb25nPy50cmFja3M/XG4gICAgICAjIGFwcGx5IGRlY2F5IHRvIG1ldGVyIGxldmVsc1xuICAgICAgZm9yIHRyYWNrIGluIEBzb25nLnRyYWNrc1xuICAgICAgICBpZiBAc3RhdGVbdHJhY2suX2lkXT9cbiAgICAgICAgICBAc3RhdGVbdHJhY2suX2lkXS5tZXRlckxldmVsIC09IG1ldGVyRGVjYXlcblxuICAjIGdldCBhIHNlbmRhYmxlIHZlcnNpb24gb2YgY3VycmVudCBzb25nIHBsYXliYWNrIHN0YXRlXG4gIGdldFN0YXRlOiAtPlxuICAgIG1ldGVyTGV2ZWxzOiBAc29uZz8udHJhY2tzPy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtb1t0cmFjay5faWRdID0gQHN0YXRlW3RyYWNrLl9pZF0/Lm1ldGVyTGV2ZWxcbiAgICAgIG1lbW9cbiAgICAsIHt9KVxuXG4iLCJpbnN0cnVtZW50VHlwZXMgPVxuICBBbmFsb2dTeW50aGVzaXplcjogcmVxdWlyZSAnLi9hbmFsb2dfc3ludGhlc2l6ZXInXG4gIEJhc2ljU2FtcGxlcjogcmVxdWlyZSAnLi9iYXNpY19zYW1wbGVyJ1xuICBEcnVtU2FtcGxlcjogcmVxdWlyZSAnLi9kcnVtX3NhbXBsZXInXG4gIERydW1TeW50aGVzaXplcjogcmVxdWlyZSAnLi9kcnVtX3N5bnRoZXNpemVyJ1xuICBMb29wU2FtcGxlcjogcmVxdWlyZSAnLi9sb29wX3NhbXBsZXInXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUcmFja1xuXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCB0cmFjaykgLT5cbiAgICBzdGF0ZVt0cmFjay5faWRdID1cbiAgICAgIG1ldGVyTGV2ZWw6IDBcblxuICBAcmVsZWFzZVN0YXRlOiAoc3RhdGUsIHRyYWNrKSAtPlxuICAgIGRlbGV0ZSBzdGF0ZVt0cmFjay5faWRdXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBzYW1wbGVzLCB0cmFjaywgdGltZSwgaSkgLT5cbiAgICAjIGdldCBpbnN0cnVtZW50IG91dHB1dFxuICAgIEluc3RydW1lbnQgPSBpbnN0cnVtZW50VHlwZXNbdHJhY2suaW5zdHJ1bWVudC5fdHlwZV1cbiAgICBzYW1wbGUgPSBJbnN0cnVtZW50LnNhbXBsZSBzdGF0ZSwgc2FtcGxlcywgdHJhY2suaW5zdHJ1bWVudCwgdGltZSwgaVxuXG4gICAgIyBhcHBseSBlZmZlY3RzXG4gICAgc2FtcGxlID0gdHJhY2suZWZmZWN0cy5yZWR1Y2UoKHNhbXBsZSwgZWZmZWN0KSAtPlxuICAgICAgRWZmZWN0LnNhbXBsZSBzdGF0ZSwgZWZmZWN0LCB0aW1lLCBpLCBzYW1wbGVcbiAgICAsIHNhbXBsZSlcblxuICAgICMgdXBkYXRlIG1ldGVyIGxldmVsc1xuICAgIGlmIHRyYWNrU3RhdGUgPSBzdGF0ZVt0cmFjay5faWRdXG4gICAgICBsZXZlbCA9IHRyYWNrU3RhdGUubWV0ZXJMZXZlbFxuICAgICAgaWYgbm90IGxldmVsPyBvciBpc05hTihsZXZlbCkgb3Igc2FtcGxlID4gbGV2ZWxcbiAgICAgICAgdHJhY2tTdGF0ZS5tZXRlckxldmVsID0gc2FtcGxlXG5cbiAgICBzYW1wbGVcblxuICBAdGljazogKHN0YXRlLCB0cmFjaywgbWlkaU1lc3NhZ2VzLCB0aW1lLCBpLCBiZWF0LCBsYXN0QmVhdCwgYnBzKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgdHJhY2sgdW5sZXNzIHN0YXRlW3RyYWNrLl9pZF0/XG5cbiAgICBJbnN0cnVtZW50ID0gaW5zdHJ1bWVudFR5cGVzW3RyYWNrLmluc3RydW1lbnQuX3R5cGVdXG5cbiAgICAjIGdldCBub3RlcyBvbiBmcm9tIHNlcXVlbmNlXG4gICAge25vdGVzT24sIG5vdGVzT2ZmfSA9IEBub3RlcyB0cmFjay5zZXF1ZW5jZSwgbWlkaU1lc3NhZ2VzLCB0aW1lLCBiZWF0LCBsYXN0QmVhdFxuXG4gICAgSW5zdHJ1bWVudC50aWNrIHN0YXRlLCB0cmFjay5pbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24sIG5vdGVzT2ZmXG4gICAgdHJhY2suZWZmZWN0cy5mb3JFYWNoIChlKSAtPiBlLnRpY2sgc3RhdGUsIHRpbWUsIGJlYXQsIGJwc1xuXG4gICMgbG9vayBhdCBzZXF1ZW5jZSBhbmQgbWlkaSBtZXNzYWdlcywgcmV0dXJuIGFycmF5cyBvZiBub3RlcyBvbiBhbmQgb2ZmXG4gICMgb2NjdXJyaW5nIGluIHRoaXMgdGlja1xuICBAbm90ZXM6IChzZXF1ZW5jZSwgbWlkaU1lc3NhZ2VzLCB0aW1lLCBiZWF0LCBsYXN0QmVhdCkgLT5cbiAgICBiYXIgPSBNYXRoLmZsb29yIGJlYXQgLyBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGxhc3RCYXIgPSBNYXRoLmZsb29yIGxhc3RCZWF0IC8gc2VxdWVuY2UubG9vcFNpemVcbiAgICBiZWF0ID0gYmVhdCAlIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgbGFzdEJlYXQgPSBsYXN0QmVhdCAlIHNlcXVlbmNlLmxvb3BTaXplXG5cbiAgICBub3Rlc09uID0gW11cbiAgICBub3Rlc09mZiA9IFtdXG5cbiAgICBmb3IgaWQsIG5vdGUgb2Ygc2VxdWVuY2Uubm90ZXNcbiAgICAgIHN0YXJ0ID0gbm90ZS5zdGFydFxuICAgICAgZW5kID0gbm90ZS5zdGFydCArIG5vdGUubGVuZ3RoXG5cbiAgICAgICMgY2F0Y2ggbm90ZXMgb25cbiAgICAgIGlmIHN0YXJ0IDwgYmVhdCBhbmQgKHN0YXJ0ID49IGxhc3RCZWF0IG9yIGJhciA+IGxhc3RCYXIpXG4gICAgICAgIG5vdGVzT24ucHVzaCB7a2V5OiBub3RlLmtleX1cblxuICAgICAgIyBjYXRjaCBub3RlcyBvZmZcbiAgICAgIGlmIGVuZCA8IGJlYXQgYW5kIChlbmQgPj0gbGFzdEJlYXQgb3IgYmFyID4gbGFzdEJhcilcbiAgICAgICAgbm90ZXNPZmYucHVzaCB7a2V5OiBub3RlLmtleX1cblxuICAgICAgIyBjYXRjaCBub3RlcyBvZmYgZm9yIG5vdGVzIGVuZGluZyBleHRhY3RseSBhdCB0aGUgZW5kIG9mIGEgYmFyXG4gICAgICBlbHNlIGlmIGJhciA+IGxhc3RCYXIgYW5kIGVuZCA9PSBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgICAgICBub3Rlc09mZi5wdXNoIHtrZXk6IG5vdGUua2V5fVxuXG4gICAgaWYgbWlkaU1lc3NhZ2VzP1xuICAgICAgbWlkaU1lc3NhZ2VzLmZvckVhY2ggKG1lc3NhZ2UsIGkpIC0+XG4gICAgICAgIGlmIG1lc3NhZ2UudGltZSA8IHRpbWVcbiAgICAgICAgICBtaWRpTWVzc2FnZXMuc3BsaWNlIGksIDFcbiAgICAgICAgICBzd2l0Y2ggbWVzc2FnZS50eXBlXG4gICAgICAgICAgICB3aGVuICdvbidcbiAgICAgICAgICAgICAgbm90ZXNPbi5wdXNoIGtleTogbWVzc2FnZS5rZXlcbiAgICAgICAgICAgIHdoZW4gJ29mZidcbiAgICAgICAgICAgICAgbm90ZXNPZmYucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG5cbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9XG4iXX0=
