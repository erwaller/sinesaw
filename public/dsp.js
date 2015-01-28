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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2FuYWxvZ19zeW50aGVzaXplci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvYmFzaWNfc2FtcGxlci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvci5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvY29tcG9uZW50cy9sb2dfc2FtcGxlLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL29zY2lsbGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3JpbmdfYnVmZmVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZS5jb2ZmZWUiLCIvVXNlcnMvY2hhcmxpZXNjaHdhYmFjaGVyL0NvZGUvc2luZXNhdy9hcHAvc2NyaXB0cy9kc3AvZHJ1bV9zYW1wbGVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9kcnVtX3N5bnRoZXNpemVyLmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9pbnN0cnVtZW50LmNvZmZlZSIsIi9Vc2Vycy9jaGFybGllc2Nod2FiYWNoZXIvQ29kZS9zaW5lc2F3L2FwcC9zY3JpcHRzL2RzcC9sb29wX3NhbXBsZXIuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3NvbmcuY29mZmVlIiwiL1VzZXJzL2NoYXJsaWVzY2h3YWJhY2hlci9Db2RlL3NpbmVzYXcvYXBwL3NjcmlwdHMvZHNwL3RyYWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1lBLElBQUEsSUFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLG1CQUFSLENBQVAsQ0FBQTs7QUFBQSxJQUVJLENBQUMsSUFBTCxHQUFZLEdBQUEsQ0FBQSxJQUZaLENBQUE7O0FBQUEsSUFJSSxDQUFDLFNBQUwsR0FBaUIsT0FBQSxDQUFRLDZCQUFSLENBSmpCLENBQUE7O0FBQUEsSUFPSSxDQUFDLFNBQUwsR0FBaUIsU0FBQyxDQUFELEdBQUE7QUFDZixVQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBZDtBQUFBLFNBQ08sUUFEUDthQUVJLElBQUksQ0FBQyxNQUFMLENBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFu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QUEsaUJBQ08sSUFEUDtxQkFFSSxPQUFPLENBQUMsSUFBUixDQUFhO0FBQUEsZ0JBQUEsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUFiO2VBQWIsRUFGSjtBQUFBLGlCQUdPLEtBSFA7cUJBSUksUUFBUSxDQUFDLElBQVQsQ0FBYztBQUFBLGdCQUFBLEdBQUEsRUFBSyxPQUFPLENBQUMsR0FBYjtlQUFkLEVBSko7QUFBQSxXQUZGO1NBRG1CO01BQUEsQ0FBckIsQ0FBQSxDQURGO0tBaEJBO1dBMEJBO0FBQUEsTUFBQyxTQUFBLE9BQUQ7QUFBQSxNQUFVLFVBQUEsUUFBVjtNQTNCTTtFQUFBLENBdENSLENBQUE7O2VBQUE7O0lBVkYsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIHRoaXMgc2NyaXB0IGlzIHJ1biBpbnNpZGUgYSB3b3JrZXIgaW4gb3JkZXIgdG8gZG8gYXVkaW8gcHJvY2Vzc2luZyBvdXRzaWRlIG9mXG4jIHRoZSBtYWluIHVpIHRocmVhZC5cbiNcbiMgVGhlIHdvcmtlciByZWNlaXZlcyB0aHJlZSB0eXBlcyBvZiBtZXNzYWdlcyAtICd1cGRhdGUnIHcvIHtzdGF0ZX0gY29udGFpbmluZ1xuIyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc29uZywgJ21pZGknIHcvIHttZXNzYWdlfSBjb250YWluaW5nIGluY29taW5nIG5vdGVPblxuIyBhbmQgbm90ZU9mZiBtZXNzYWdlcywgYW5kICdidWZmZXInIHcvIHtzaXplLCBpbmRleCwgc2FtcGxlUmF0ZX0gcmVxdWVzdGluZ1xuIyBhIGJ1ZmZlciB0byBiZSBmaWxsZWQgYW5kIHNlbnQgYmFjay5cbiNcbiMgSXQgYWxzbyBzZW5kcyB0d28gdHlwZXMgb2YgbWVzc2FnZXMgLSAnZnJhbWUnIG1lc3NhZ2VzIGF0IDYwaHogY29udGFpbmluZyB0aGVcbiMgY3VycmVudCBwbGF5YmFjayBzdGF0ZSBhcyB7ZnJhbWV9LCBhbmQgc2VuZHMgJ2J1ZmZlcicgbWVzc2FnZXMgdHJhbnNmZXJyaW5nXG4jIGZpbGxlZCBBcnJheUJ1ZmZlcnMgaW4gcmVzcG9uc2UgdG8gJ2J1ZmZlcicgcmVxdWVzdHMuXG5cblNvbmcgPSByZXF1aXJlICcuL2RzcC9zb25nLmNvZmZlZSdcblxuc2VsZi5zb25nID0gbmV3IFNvbmdcblxuc2VsZi5sb2dTYW1wbGUgPSByZXF1aXJlICcuL2RzcC9jb21wb25lbnRzL2xvZ19zYW1wbGUnXG5cbiMgcmVzcG9uZCB0byBtZXNzYWdlcyBmcm9tIHBhcmVudCB0aHJlYWRcbnNlbGYub25tZXNzYWdlID0gKGUpIC0+XG4gIHN3aXRjaCBlLmRhdGEudHlwZVxuICAgIHdoZW4gJ2J1ZmZlcidcbiAgICAgIHNvbmcuYnVmZmVyIGUuZGF0YS5zaXplLCBlLmRhdGEuaW5kZXgsIGUuZGF0YS5zYW1wbGVSYXRlLCAoYnVmZmVyKSAtPlxuICAgICAgICBwb3N0TWVzc2FnZVxuICAgICAgICAgIHR5cGU6ICdidWZmZXInXG4gICAgICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgICAgLCBbYnVmZmVyXVxuICAgIHdoZW4gJ3VwZGF0ZSdcbiAgICAgIHNvbmcudXBkYXRlIGUuZGF0YS5zdGF0ZVxuICAgIHdoZW4gJ21pZGknXG4gICAgICBzb25nLm1pZGkgZS5kYXRhLm1lc3NhZ2VcbiAgICB3aGVuICdhZGRTYW1wbGUnXG4gICAgICBzb25nLmFkZFNhbXBsZSBlLmRhdGEuaWQsIGUuZGF0YS5zYW1wbGVEYXRhXG4gICAgd2hlbiAncmVtb3ZlU2FtcGxlJ1xuICAgICAgc29uZy5yZW1vdmVTYW1wbGUgZS5kYXRhLmlkXG5cbiMgdHJpZ2dlciBwcm9jZXNzaW5nIG9uIHNvbmcgYXQgZnJhbWUgcmF0ZSBhbmQgc2VuZCB1cGRhdGVzIHRvIHRoZSBwYXJlbnQgdGhyZWFkXG5zZXRJbnRlcnZhbCAtPlxuICBzb25nLnByb2Nlc3NGcmFtZSgpXG4gIHBvc3RNZXNzYWdlXG4gICAgdHlwZTogJ2ZyYW1lJ1xuICAgIGZyYW1lOiBzb25nLmdldFN0YXRlKClcbiwgMTAwMCAvIDYwXG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuUmluZ0J1ZmZlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9yaW5nX2J1ZmZlcidcbmxvd3Bhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbG93cGFzc19maWx0ZXInXG5oaWdocGFzc0ZpbHRlciA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9oaWdocGFzc19maWx0ZXInXG5lbnZlbG9wZSA9IHJlcXVpcmUgJy4vY29tcG9uZW50cy9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQW5hbG9nU3ludGhlc2l6ZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgdHVuZSA9IDQ0MFxuICBmcmVxdWVuY3kgPSAoa2V5KSAtPlxuICAgIHR1bmUgKiBNYXRoLnBvdyAyLCAoa2V5IC0gNjkpIC8gMTJcblxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdXBlciBzdGF0ZSwgaW5zdHJ1bWVudFxuXG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnMgPVxuICAgICAgTFA6IChsb3dwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBIUDogKGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG4gICAgICBub25lOiAoKChzYW1wbGUpIC0+IHNhbXBsZSkgZm9yIGkgaW4gWzAuLi5pbnN0cnVtZW50Lm1heFBvbHlwaG9ueV0pXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBzYW1wbGVzLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICByID0gTWF0aC5tYXggMC4wMSwgaW5zdHJ1bWVudC52b2x1bWVFbnYuclxuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXMucmVkdWNlKChtZW1vLCBub3RlLCBpbmRleCkgPT5cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuICAgICAgcmV0dXJuIG1lbW8gaWYgdGltZSA+IHIgKyBub3RlLnRpbWVPZmZcblxuICAgICAgIyBzdW0gb3NjaWxsYXRvcnMgYW5kIGFwcGx5IHZvbHVtZSBlbnZlbG9wZVxuICAgICAgb3NjMUZyZXEgPSBmcmVxdWVuY3kgbm90ZS5rZXkgKyBpbnN0cnVtZW50Lm9zYzEudHVuZSAtIDAuNSArIE1hdGgucm91bmQoMjQgKiAoaW5zdHJ1bWVudC5vc2MxLnBpdGNoIC0gMC41KSlcbiAgICAgIG9zYzJGcmVxID0gZnJlcXVlbmN5IG5vdGUua2V5ICsgaW5zdHJ1bWVudC5vc2MyLnR1bmUgLSAwLjUgKyBNYXRoLnJvdW5kKDI0ICogKGluc3RydW1lbnQub3NjMi5waXRjaCAtIDAuNSkpXG4gICAgICBzYW1wbGUgPSBlbnZlbG9wZShpbnN0cnVtZW50LnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoXG4gICAgICAgIGluc3RydW1lbnQub3NjMS5sZXZlbCAqIG9zY2lsbGF0b3JzW2luc3RydW1lbnQub3NjMS53YXZlZm9ybV0odGltZSwgb3NjMUZyZXEpICtcbiAgICAgICAgaW5zdHJ1bWVudC5vc2MyLmxldmVsICogb3NjaWxsYXRvcnNbaW5zdHJ1bWVudC5vc2MyLndhdmVmb3JtXSh0aW1lLCBvc2MyRnJlcSlcbiAgICAgIClcblxuICAgICAgIyBhcHBseSBmaWx0ZXIgd2l0aCBlbnZlbG9wZVxuICAgICAgY3V0b2ZmID0gTWF0aC5taW4gMSwgaW5zdHJ1bWVudC5maWx0ZXIuZnJlcSArIGluc3RydW1lbnQuZmlsdGVyLmVudiAqIGVudmVsb3BlKGluc3RydW1lbnQuZmlsdGVyRW52LCBub3RlLCB0aW1lKVxuICAgICAgZmlsdGVyID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnNbaW5zdHJ1bWVudC5maWx0ZXIudHlwZV1baW5kZXhdXG4gICAgICBzYW1wbGUgPSBmaWx0ZXIgc2FtcGxlLCBjdXRvZmYsIGluc3RydW1lbnQuZmlsdGVyLnJlc1xuXG4gICAgICAjIHJldHVybiByZXN1bHRcbiAgICAgIG1lbW8gKyBzYW1wbGVcblxuICAgICwgMClcbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xubGluZWFySW50ZXJwb2xhdG9yID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xpbmVhcl9pbnRlcnBvbGF0b3InXG5sb3dwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2xvd3Bhc3NfZmlsdGVyJ1xuaGlnaHBhc3NGaWx0ZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvaGlnaHBhc3NfZmlsdGVyJ1xuZW52ZWxvcGUgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvZW52ZWxvcGUnXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBCYXNpY1NhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3VwZXIgc3RhdGUsIGluc3RydW1lbnRcblxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzID1cbiAgICAgIExQOiAobG93cGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgSFA6IChoaWdocGFzc0ZpbHRlcigpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuICAgICAgbm9uZTogKCgoc2FtcGxlKSAtPiBzYW1wbGUpIGZvciBpIGluIFswLi4uaW5zdHJ1bWVudC5tYXhQb2x5cGhvbnldKVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgc2FtcGxlcywgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgc2FtcGxlRGF0YSA9IHNhbXBsZXNbaW5zdHJ1bWVudC5zYW1wbGVJZF1cbiAgICByZXR1cm4gMCB1bmxlc3Mgc2FtcGxlRGF0YT9cblxuICAgIHIgPSBNYXRoLm1heCAwLjAxLCBpbnN0cnVtZW50LnZvbHVtZUVudi5yXG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlcy5yZWR1Y2UoKG1lbW8sIG5vdGUsIGluZGV4KSA9PlxuICAgICAgcmV0dXJuIG1lbW8gdW5sZXNzIG5vdGU/XG4gICAgICByZXR1cm4gbWVtbyBpZiB0aW1lID4gciArIG5vdGUudGltZU9mZlxuXG4gICAgICAjIGdldCBwaXRjaCBzaGlmdGVkIGludGVycG9sYXRlZCBzYW1wbGUgYW5kIGFwcGx5IHZvbHVtZSBlbnZlbG9wZVxuICAgICAgdHJhbnNwb3NlID0gbm90ZS5rZXkgLSBpbnN0cnVtZW50LnJvb3RLZXkgKyBpbnN0cnVtZW50LnR1bmUgLSAwLjVcbiAgICAgIHNhbXBsZXNFbGFwc2VkID0gaSAtIG5vdGUuaVxuICAgICAgb2Zmc2V0ID0gTWF0aC5mbG9vciBpbnN0cnVtZW50LnN0YXJ0ICogc2FtcGxlRGF0YS5sZW5ndGhcbiAgICAgIGxvb3BBY3RpdmUgPSBpbnN0cnVtZW50Lmxvb3BBY3RpdmUgaXMgJ2xvb3AnXG4gICAgICBsb29wUG9pbnQgPSBNYXRoLmZsb29yIGluc3RydW1lbnQubG9vcCAqIHNhbXBsZURhdGEubGVuZ3RoXG4gICAgICBzYW1wbGUgPSBsaW5lYXJJbnRlcnBvbGF0b3Igc2FtcGxlRGF0YSwgdHJhbnNwb3NlLCBzYW1wbGVzRWxhcHNlZCwgb2Zmc2V0LCBsb29wQWN0aXZlLCBsb29wUG9pbnRcbiAgICAgIHNhbXBsZSA9IGVudmVsb3BlKGluc3RydW1lbnQudm9sdW1lRW52LCBub3RlLCB0aW1lKSAqIChzYW1wbGUgb3IgMClcblxuICAgICAgIyBhcHBseSBmaWx0ZXIgd2l0aCBlbnZlbG9wZVxuICAgICAgY3V0b2ZmID0gTWF0aC5taW4gMSwgaW5zdHJ1bWVudC5maWx0ZXIuZnJlcSArIGluc3RydW1lbnQuZmlsdGVyLmVudiAqIGVudmVsb3BlKGluc3RydW1lbnQuZmlsdGVyRW52LCBub3RlLCB0aW1lKVxuICAgICAgZmlsdGVyID0gc3RhdGVbaW5zdHJ1bWVudC5faWRdLmZpbHRlcnNbaW5zdHJ1bWVudC5maWx0ZXIudHlwZV1baW5kZXhdXG4gICAgICBzYW1wbGUgPSBmaWx0ZXIgc2FtcGxlLCBjdXRvZmYsIGluc3RydW1lbnQuZmlsdGVyLnJlc1xuXG4gICAgICAjIHJldHVybiByZXN1bHRcbiAgICAgIG1lbW8gKyBzYW1wbGVcblxuICAgICwgMClcbiIsIm1pbkVudlZhbHVlID0gMC4wMVxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbnYsIG5vdGUsIHRpbWUpIC0+XG4gIGVsYXBzZWQgPSB0aW1lIC0gbm90ZS50aW1lXG4gIGEgPSBNYXRoLm1heCBtaW5FbnZWYWx1ZSwgZW52LmFcbiAgZCA9IE1hdGgubWF4IG1pbkVudlZhbHVlLCBlbnYuZFxuICBzID0gZW52LnNcbiAgciA9IE1hdGgubWF4IG1pbkVudlZhbHVlLCBlbnYuclxuXG4gICMgYXR0YWNrLCBkZWNheSwgc3VzdGFpblxuICBsID0gaWYgZWxhcHNlZCA+IGEgKyBkXG4gICAgbCA9IHNcbiAgZWxzZSBpZiBlbGFwc2VkID4gYVxuICAgIGwgPSBzICsgKDEgLSBzKSAqIChhICsgZCAtIGVsYXBzZWQpIC8gZFxuICBlbHNlXG4gICAgZWxhcHNlZCAvIGFcblxuICAjIHJlbGVhc2VcbiAgaWYgbm90ZS50aW1lT2ZmXG4gICAgbCA9IGwgKiAobm90ZS50aW1lT2ZmICsgciAtIHRpbWUpIC8gclxuXG4gIE1hdGgubWF4IDAsIGxcbiIsInNhbXBsZVJhdGUgPSA0ODAwMFxubWF4RnJlcSA9IDEyMDAwXG5kYkdhaW4gPSAxMiAgICAjIGdhaW4gb2YgZmlsdGVyXG5iYW5kd2lkdGggPSAxICAjIGJhbmR3aWR0aCBpbiBvY3RhdmVzXG5cbiMgY29uc3RhbnRzXG5BID0gTWF0aC5wb3coMTAsIGRiR2FpbiAvIDQwKVxuZSA9IE1hdGgubG9nKDIpXG50YXUgPSAyICogTWF0aC5QSVxuYmV0YSA9IE1hdGguc3FydCgyICogQSlcblxuIyBoeXBlcmJvbGljIHNpbiBmdW5jdGlvblxuc2luaCA9ICh4KSAtPlxuICB5ID0gTWF0aC5leHAgeFxuICAoeSAtIDEgLyB5KSAvIDJcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBhMCA9IGExID0gYTIgPSBhMyA9IGE0ID0geDEgPSB4MiA9IHkxID0geTIgPSAwXG4gIGZyZXEgPSBvbWVnYSA9IHNuID0gYWxwaGEgPSAwXG4gIGNzID0gMVxuXG4gIGxhc3RDdXRvZmYgPSAwXG5cbiAgKHNhbXBsZSwgY3V0b2ZmKSAtPlxuICAgICMgY2FjaGUgZmlsdGVyIHZhbHVlcyB1bnRpbCBjdXRvZmYgY2hhbmdlc1xuICAgIGlmIGN1dG9mZiAhPSBsYXN0Q3V0b2ZmXG4gIFxuICAgICAgb2xkQ3V0b2ZmID0gY3V0b2ZmXG5cbiAgICAgIGZyZXEgPSBjdXRvZmYgKiBtYXhGcmVxXG4gICAgICBvbWVnYSA9IHRhdSAqIGZyZXEgLyBzYW1wbGVSYXRlXG4gICAgICBzbiA9IE1hdGguc2luIG9tZWdhXG4gICAgICBjcyA9IE1hdGguY29zIG9tZWdhXG4gICAgICBhbHBoYSA9IHNuICogc2luaChlIC8gMiAqIGJhbmR3aWR0aCAqIG9tZWdhIC8gc24pXG5cbiAgICAgIGIwID0gKDEgKyBjcykgLyAyXG4gICAgICBiMSA9IC0oMSArIGNzKVxuICAgICAgYjIgPSAoMSArIGNzKSAvIDJcbiAgICAgIGFhMCA9IDEgKyBhbHBoYVxuICAgICAgYWExID0gLTIgKiBjc1xuICAgICAgYWEyID0gMSAtIGFscGhhXG5cbiAgICAgIGEwID0gYjAgLyBhYTBcbiAgICAgIGExID0gYjEgLyBhYTBcbiAgICAgIGEyID0gYjIgLyBhYTBcbiAgICAgIGEzID0gYWExIC8gYWEwXG4gICAgICBhNCA9IGFhMiAvIGFhMFxuXG4gICAgIyBjb21wdXRlIHJlc3VsdFxuICAgIHMgPSBNYXRoLm1heCAtMSwgTWF0aC5taW4gMSwgc2FtcGxlXG4gICAgcmVzdWx0ID0gYTAgKiBzICsgYTEgKiB4MSArIGEyICogeDIgLSBhMyAqIHkxIC0gYTQgKiB5MlxuXG4gICAgIyBzaGlmdCB4MSB0byB4Miwgc2FtcGxlIHRvIHgxXG4gICAgeDIgPSB4MVxuICAgIHgxID0gc1xuXG4gICAgIyBzaGlmdCB5MSB0byB5MiwgcmVzdWx0IHRvIHkxXG4gICAgeTIgPSB5MVxuICAgIHkxID0gcmVzdWx0XG5cbiAgICByZXN1bHQiLCJtb2R1bGUuZXhwb3J0cyA9IChzYW1wbGVEYXRhLCB0cmFuc3Bvc2UsIHNhbXBsZXNFbGFwc2VkLCBvZmZzZXQgPSAwLCBsb29wQWN0aXZlID0gZmFsc2UsIGxvb3BQb2ludCkgLT5cbiAgaSA9IHNhbXBsZXNFbGFwc2VkICogTWF0aC5wb3cgMiwgdHJhbnNwb3NlIC8gMTJcbiAgaTEgPSBNYXRoLmZsb29yIGlcbiAgaTEgPSBpMSAlIChsb29wUG9pbnQgLSBvZmZzZXQpIGlmIGxvb3BBY3RpdmVcbiAgaTIgPSBpMSArIDFcbiAgbCA9IGkgJSAxXG5cbiAgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMV0gKiAoMSAtIGwpICsgc2FtcGxlRGF0YVtvZmZzZXQgKyBpMl0gKiBsIiwiaSA9IDBcbm1vZHVsZS5leHBvcnRzID0gKHYpIC0+XG4gIGNvbnNvbGUubG9nKHYpIGlmIGkgPT0gMFxuICBpID0gKGkgKyAxKSAlIDcwMDBcbiIsInNhbXBsZVJhdGUgPSA0ODAwMFxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG5cbiAgeTEgPSB5MiA9IHkzID0geTQgPSBvbGR4ID0gb2xkeTEgPSBvbGR5MiA9IG9sZHkzID0gMFxuICBwID0gayA9IHQxID0gdDIgPSByID0geCA9IG51bGxcblxuICAoc2FtcGxlLCBjdXRvZmYsIHJlcykgLT5cbiAgICBmcmVxID0gMjAgKiBNYXRoLnBvdyAxMCwgMyAqIGN1dG9mZlxuICAgIGZyZXEgPSBmcmVxIC8gc2FtcGxlUmF0ZVxuICAgIHAgPSBmcmVxICogKDEuOCAtICgwLjggKiBmcmVxKSlcbiAgICBrID0gMiAqIE1hdGguc2luKGZyZXEgKiBNYXRoLlBJIC8gMikgLSAxXG4gICAgdDEgPSAoMSAtIHApICogMS4zODYyNDlcbiAgICB0MiA9IDEyICsgdDEgKiB0MVxuICAgIHIgPSByZXMgKiAwLjU3ICogKHQyICsgNiAqIHQxKSAvICh0MiAtIDYgKiB0MSlcblxuICAgIHggPSBzYW1wbGUgLSByICogeTRcblxuICAgICMgZm91ciBjYXNjYWRlZCBvbmUtcG9sZSBmaWx0ZXJzIChiaWxpbmVhciB0cmFuc2Zvcm0pXG4gICAgeTEgPSAgeCAqIHAgKyBvbGR4ICAqIHAgLSBrICogeTFcbiAgICB5MiA9IHkxICogcCArIG9sZHkxICogcCAtIGsgKiB5MlxuICAgIHkzID0geTIgKiBwICsgb2xkeTIgKiBwIC0gayAqIHkzXG4gICAgeTQgPSB5MyAqIHAgKyBvbGR5MyAqIHAgLSBrICogeTRcblxuICAgICMgY2xpcHBlciBiYW5kIGxpbWl0ZWQgc2lnbW9pZFxuICAgIHk0IC09ICh5NCAqIHk0ICogeTQpIC8gNlxuXG4gICAgb2xkeCA9IHhcbiAgICBvbGR5MSA9IHkxXG4gICAgb2xkeTIgPSB5MlxuICAgIG9sZHkzID0geTNcblxuICAgIHk0IiwidGF1ID0gTWF0aC5QSSAqIDJcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gIHNpbmU6ICh0aW1lLCBmcmVxdWVuY3kpIC0+XG4gICAgTWF0aC5zaW4gdGltZSAqIHRhdSAqIGZyZXF1ZW5jeVxuXG4gIHNxdWFyZTogKHRpbWUsIGZyZXF1ZW5jeSkgLT5cbiAgICBpZiAoKHRpbWUgJSAoMSAvIGZyZXF1ZW5jeSkpICogZnJlcXVlbmN5KSAlIDEgPiAwLjUgdGhlbiAxIGVsc2UgLTFcblxuICBzYXc6ICh0aW1lLCBmcmVxdWVuY3kpIC0+XG4gICAgMSAtIDIgKiAoKCh0aW1lICUgKDEgLyBmcmVxdWVuY3kpKSAqIGZyZXF1ZW5jeSkgJSAxKVxuXG4gIG5vaXNlOiAtPlxuICAgIDIgKiBNYXRoLnJhbmRvbSgpIC0gMSIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmluZ0J1ZmZlclxuICBcbiAgY29uc3RydWN0b3I6IChAbWF4TGVuZ3RoLCBAVHlwZSA9IEZsb2F0MzJBcnJheSwgQGxlbmd0aCkgLT5cbiAgICBAbGVuZ3RoIHx8PSBAbWF4TGVuZ3RoXG4gICAgQGFycmF5ID0gbmV3IFR5cGUgQG1heExlbmd0aFxuICAgIEBwb3MgPSAwXG5cbiAgcmVzZXQ6IC0+XG4gICAgQGFycmF5ID0gbmV3IEBUeXBlIEBtYXhMZW5ndGhcbiAgICB0aGlzXG5cbiAgcmVzaXplOiAoQGxlbmd0aCkgLT5cbiAgICBAcG9zID0gMCBpZiBAcG9zID49IEBsZW5ndGhcblxuICBwdXNoOiAoZWwpIC0+XG4gICAgQGFycmF5W0Bwb3NdID0gZWxcbiAgICBAcG9zICs9IDFcbiAgICBAcG9zID0gMCBpZiBAcG9zID09IEBsZW5ndGhcbiAgICB0aGlzXG5cbiAgZm9yRWFjaDogKGZuKSAtPlxuICAgIGB2YXIgaSwgbGVuO1xuICAgIGZvciAoaSA9IHRoaXMucG9zLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBmbih0aGlzLmFycmF5W2ldLCBpKTtcbiAgICB9XG4gICAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5wb3M7IGkgPCBsZW47IGkrKykge1xuICAgICAgZm4odGhpcy5hcnJheVtpXSwgaSk7XG4gICAgfWBcbiAgICB0aGlzXG5cbiAgcmVkdWNlOiAoZm4sIG1lbW8gPSAwKSAtPlxuICAgIEBmb3JFYWNoIChlbCwgaSkgLT5cbiAgICAgIG1lbW8gPSBmbiBtZW1vLCBlbCwgaVxuICAgIG1lbW9cbiIsIm1vZHVsZS5leHBvcnRzID0gKGRlY2F5LCBlbGFwc2VkKSAtPlxuICBpZiBlbGFwc2VkID4gZGVjYXlcbiAgICAwXG4gIGVsc2VcbiAgICAxIC0gZWxhcHNlZCAvIGRlY2F5XG4iLCJJbnN0cnVtZW50ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50J1xuZW52ZWxvcGUgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvZW52ZWxvcGUnXG5saW5lYXJJbnRlcnBvbGF0b3IgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvbGluZWFyX2ludGVycG9sYXRvcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERydW1TYW1wbGVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gICMga2VlcCBub3RlcyBpbiBhIG1hcCB7a2V5OiBub3RlRGF0YX0gaW5zdGVhZCBvZiB0byBhIHJpbmcgYnVmZmVyXG4gICMgdGhpcyBnaXZlcyB1cyBvbmUgbW9ucGhvbmljIHZvaWNlIHBlciBkcnVtXG4gIEBjcmVhdGVTdGF0ZTogKHN0YXRlLCBpbnN0cnVtZW50KSAtPlxuICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXSA9IG5vdGVzOiB7fVxuXG4gIEBzYW1wbGU6IChzdGF0ZSwgc2FtcGxlcywgaW5zdHJ1bWVudCwgdGltZSwgaSkgLT5cbiAgICByZXR1cm4gMCBpZiBpbnN0cnVtZW50LmxldmVsIGlzIDBcbiAgICByZXR1cm4gMCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuXG4gICAgIyBzdW0gYWxsIGFjdGl2ZSBub3Rlc1xuICAgIGluc3RydW1lbnQubGV2ZWwgKiBpbnN0cnVtZW50LmRydW1zLnJlZHVjZSgobWVtbywgZHJ1bSkgPT5cbiAgICAgIG5vdGUgPSBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbZHJ1bS5rZXldXG4gICAgICByZXR1cm4gbWVtbyB1bmxlc3Mgbm90ZT9cblxuICAgICAgc2FtcGxlRGF0YSA9IHNhbXBsZXNbZHJ1bS5zYW1wbGVJZF1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBzYW1wbGVEYXRhP1xuXG4gICAgICBzYW1wbGVzRWxhcHNlZCA9IGkgLSBub3RlLmlcbiAgICAgIG9mZnNldCA9IE1hdGguZmxvb3IgZHJ1bS5zdGFydCAqIHNhbXBsZURhdGEubGVuZ3RoXG4gICAgICByZXR1cm4gbWVtbyBpZiBzYW1wbGVzRWxhcHNlZCArIG9mZnNldCA+IHNhbXBsZURhdGEubGVuZ3RoXG5cbiAgICAgIHNhbXBsZSA9IGxpbmVhckludGVycG9sYXRvciBzYW1wbGVEYXRhLCBkcnVtLnRyYW5zcG9zZSwgc2FtcGxlc0VsYXBzZWQsIG9mZnNldFxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnZlbG9wZShkcnVtLnZvbHVtZUVudiwgbm90ZSwgdGltZSkgKiAoc2FtcGxlIG9yIDApXG4gICAgLCAwKVxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmYpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09mZi5mb3JFYWNoICh7a2V5fSkgLT5cbiAgICAgIHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1trZXldPy50aW1lT2ZmID0gdGltZVxuXG4gICAgbm90ZXNPbi5mb3JFYWNoIChub3RlKSA9PlxuICAgICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdLm5vdGVzW25vdGUua2V5XSA9IHt0aW1lLCBpfVxuIiwiSW5zdHJ1bWVudCA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudCdcbmhpZ2hwYXNzRmlsdGVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL2hpZ2hwYXNzX2ZpbHRlcidcbnNpbXBsZUVudmVsb3BlID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3NpbXBsZV9lbnZlbG9wZSdcbm9zY2lsbGF0b3JzID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL29zY2lsbGF0b3JzJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJ1bVN5bnRoZXNpemVyIGV4dGVuZHMgSW5zdHJ1bWVudFxuXG4gIG1pbkZyZXEgPSA2MFxuICBtYXhGcmVxID0gMzAwMFxuICBmcmVxU2NhbGUgPSBtYXhGcmVxIC0gbWluRnJlcVxuXG4gICMga2VlcCBub3RlcyBpbiBhIG1hcCB7a2V5OiBub3RlRGF0YX0gaW5zdGVhZCBvZiBpbiBhIHJpbmcgYnVmZmVyXG4gICMgdGhpcyBnaXZlcyB1cyBvbmUgbW9ucGhvbmljIHZvaWNlIHBlciBkcnVtLlxuICBAY3JlYXRlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0gPVxuICAgICAgbm90ZXM6IHt9XG4gICAgICBmaWx0ZXJzOiAoXG4gICAgICAgIGhpZ2hwYXNzRmlsdGVyKCkgZm9yIGkgaW4gWzAuLi4xMjddXG4gICAgICApXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBzYW1wbGVzLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIHJldHVybiAwIGlmIGluc3RydW1lbnQubGV2ZWwgaXMgMFxuICAgIHJldHVybiAwIHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICAjIHN1bSBhbGwgYWN0aXZlIG5vdGVzXG4gICAgaW5zdHJ1bWVudC5sZXZlbCAqIGluc3RydW1lbnQuZHJ1bXMucmVkdWNlKChtZW1vLCBkcnVtKSA9PlxuICAgICAgbm90ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5ub3Rlc1tkcnVtLmtleV1cbiAgICAgIHJldHVybiBtZW1vIHVubGVzcyBub3RlP1xuXG4gICAgICBlbGFwc2VkID0gdGltZSAtIG5vdGUudGltZVxuICAgICAgcmV0dXJuIG1lbW8gaWYgZWxhcHNlZCA+IGRydW0uZGVjYXlcblxuICAgICAgZW52ID0gc2ltcGxlRW52ZWxvcGUgZHJ1bS5kZWNheSwgZWxhcHNlZFxuICAgICAgZnJlcSA9IG1pbkZyZXEgKyBkcnVtLnBpdGNoICogZnJlcVNjYWxlXG5cbiAgICAgICMgYXBwbHkgcGl0Y2ggYmVuZFxuICAgICAgaWYgZHJ1bS5iZW5kXG4gICAgICAgIGZyZXEgPSAoMiAtIGRydW0uYmVuZCArIGRydW0uYmVuZCAqIGVudikgLyAyICogZnJlcVxuXG4gICAgICAjIGFwcGx5IGZtXG4gICAgICBpZiBkcnVtLmZtID4gMFxuICAgICAgICBzaWduYWwgPSBvc2NpbGxhdG9ycy5zaW5lIGVsYXBzZWQsIG1pbkZyZXEgKyBkcnVtLmZtRnJlcSAqIGZyZXFTY2FsZVxuICAgICAgICBmcmVxICs9IGRydW0uZm0gKiBzaWduYWwgKiBzaW1wbGVFbnZlbG9wZShkcnVtLmZtRGVjYXkgKyAwLjAxLCBlbGFwc2VkKVxuXG4gICAgICAjIHN1bSBub2lzZSBhbmQgb3NjaWxsYXRvclxuICAgICAgc2FtcGxlID0gKFxuICAgICAgICAoMSAtIGRydW0ubm9pc2UpICogb3NjaWxsYXRvcnMuc2luZShlbGFwc2VkLCBmcmVxKSArXG4gICAgICAgIGRydW0ubm9pc2UgKiBvc2NpbGxhdG9ycy5ub2lzZSgpXG4gICAgICApXG5cbiAgICAgICMgYXBwbHkgaGlnaHBhc3NcbiAgICAgIGlmIGRydW0uaHAgPiAwXG4gICAgICAgIHNhbXBsZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXS5maWx0ZXJzW2RydW0ua2V5XSBzYW1wbGUsIGRydW0uaHBcblxuICAgICAgbWVtbyArIGRydW0ubGV2ZWwgKiBlbnYgKiBzYW1wbGVcblxuICAgICwgMClcblxuXG4gIEB0aWNrOiAoc3RhdGUsIGluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmYpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCBpbnN0cnVtZW50IHVubGVzcyBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0/XG5cbiAgICBub3Rlc09uLmZvckVhY2ggKG5vdGUpID0+XG4gICAgICBzdGF0ZVtpbnN0cnVtZW50Ll9pZF0ubm90ZXNbbm90ZS5rZXldID0ge3RpbWUsIGl9XG5cbiIsIlJpbmdCdWZmZXIgPSByZXF1aXJlICcuL2NvbXBvbmVudHMvcmluZ19idWZmZXInXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnN0cnVtZW50XG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIGluc3RydW1lbnQpIC0+XG4gICAgc3RhdGVbaW5zdHJ1bWVudC5faWRdID1cbiAgICAgIG5vdGVzOiBuZXcgUmluZ0J1ZmZlciBpbnN0cnVtZW50Lm1heFBvbHlwaG9ueSwgQXJyYXksIGluc3RydW1lbnQucG9seXBob255XG4gICAgICBub3RlTWFwOiB7fVxuXG4gIEByZWxlYXNlU3RhdGU6IChzdGF0ZSwgaW5zdHJ1bWVudCkgLT5cbiAgICBkZWxldGUgc3RhdGVbaW5zdHJ1bWVudC5faWRdXG5cbiAgQHNhbXBsZTogKHN0YXRlLCBzYW1wbGVzLCBpbnN0cnVtZW50LCB0aW1lLCBpKSAtPlxuICAgIDBcblxuICBAdGljazogKHN0YXRlLCBpbnN0cnVtZW50LCB0aW1lLCBpLCBiZWF0LCBicHMsIG5vdGVzT24sIG5vdGVzT2ZmKSAtPlxuICAgIEBjcmVhdGVTdGF0ZSBzdGF0ZSwgaW5zdHJ1bWVudCB1bmxlc3Mgc3RhdGVbaW5zdHJ1bWVudC5faWRdP1xuICAgIGluc3RydW1lbnRTdGF0ZSA9IHN0YXRlW2luc3RydW1lbnQuX2lkXVxuXG4gICAgaWYgaW5zdHJ1bWVudC5wb2x5cGhvbnkgIT0gaW5zdHJ1bWVudFN0YXRlLm5vdGVzLmxlbmd0aFxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVzLnJlc2l6ZSBpbnN0cnVtZW50LnBvbHlwaG9ueVxuXG4gICAgbm90ZXNPZmYuZm9yRWFjaCAoe2tleX0pIC0+XG4gICAgICAjIGNvbnNvbGUubG9nICdub3RlIG9mZiAnICsga2V5XG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZU1hcFtrZXldPy50aW1lT2ZmID0gdGltZVxuXG4gICAgbm90ZXNPbi5mb3JFYWNoICh7a2V5fSkgLT5cbiAgICAgICMgY29uc29sZS5sb2cgJ25vdGUgb24gJyArIGtleVxuICAgICAgaW5zdHJ1bWVudFN0YXRlLm5vdGVNYXBba2V5XSA9IHt0aW1lLCBpLCBrZXl9XG4gICAgICBpbnN0cnVtZW50U3RhdGUubm90ZXMucHVzaCBpbnN0cnVtZW50U3RhdGUubm90ZU1hcFtrZXldXG5cbiIsIkluc3RydW1lbnQgPSByZXF1aXJlICcuL2luc3RydW1lbnQnXG5SaW5nQnVmZmVyID0gcmVxdWlyZSAnLi9jb21wb25lbnRzL3JpbmdfYnVmZmVyJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTG9vcFNhbXBsZXIgZXh0ZW5kcyBJbnN0cnVtZW50XG4iLCJUcmFjayA9IHJlcXVpcmUgJy4vdHJhY2snXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU29uZ1xuXG4gICMgbnVtYmVyIG9mIHNhbXBsZXMgdG8gcHJvY2VzcyBiZXR3ZWVuIHRpY2tzXG4gIGNsb2NrUmF0aW8gPSAxMTBcblxuICAjIHJhdGUgYXQgd2hpY2ggbGV2ZWwgbWV0ZXJzIGRlY2F5XG4gIG1ldGVyRGVjYXkgPSAwLjA1XG5cbiAgY2xpcCA9IChzYW1wbGUpIC0+XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oMiwgc2FtcGxlICsgMSkpIC0gMVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBsYXN0QmVhdCA9IDBcblxuICAgICMga2VlcCBtdXRhYmxlIHN0YXRlIGZvciBhdWRpbyBwbGF5YmFjayBoZXJlIC0gdGhpcyB3aWxsIHN0b3JlIHRoaW5ncyBsaWtlXG4gICAgIyBmaWx0ZXIgbWVtb3J5IGFuZCBtZXRlciBsZXZlbHMgdGhhdCBuZWVkIHRvIHN0YXkgb3V0c2lkZSB0aGUgbm9ybWFsIGN1cnNvclxuICAgICMgc3RydWN0dXJlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG4gICAgQHN0YXRlID0ge31cblxuICAgICMga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBzb25nIGRvY3VtZW50XG4gICAgQHNvbmcgPSBudWxsXG5cbiAgICAjIGtlZXAgcmVmZXJlbmNlcyB0byB0aGUgY3VycmVudGx5IHVzZWQgc2FtcGxlc1xuICAgIEBzYW1wbGVzID0ge31cblxuICAgICMga2VlcCBhIGxpc3Qgb2YgdW5wcm9jZXNzZWQgbWlkaSBtZXNzYWdlc1xuICAgIEBtaWRpTWVzc2FnZXMgPSBbXVxuXG4gIHVwZGF0ZTogKHN0YXRlKSAtPlxuICAgIEBzb25nID0gc3RhdGVcblxuICBtaWRpOiAobWVzc2FnZSkgLT5cbiAgICBAbWlkaU1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuXG4gICMgZmlsbCBhIGJ1ZmZlciBmdW5jdGlvblxuICBidWZmZXI6IChzaXplLCBpbmRleCwgc2FtcGxlUmF0ZSwgY2IpIC0+XG4gICAgYXJyID0gbmV3IEZsb2F0MzJBcnJheSBzaXplXG5cbiAgICBpZiBAc29uZz9cbiAgICAgIGZvciBpIGluIFswLi4uc2l6ZV1cbiAgICAgICAgaWkgPSBpbmRleCArIGlcbiAgICAgICAgdCA9IGlpIC8gc2FtcGxlUmF0ZVxuICAgICAgICBhcnJbaV0gPSBAc2FtcGxlIHQsIGlpXG5cbiAgICBjYiBhcnIuYnVmZmVyXG5cbiAgIyBjYWxsZWQgZm9yIGV2ZXJ5IHNhbXBsZSBvZiBhdWRpb1xuICBzYW1wbGU6ICh0aW1lLCBpKSA9PlxuICAgIEB0aWNrIHRpbWUsIGkgaWYgaSAlIGNsb2NrUmF0aW8gaXMgMFxuXG4gICAgY2xpcCBAc29uZy5sZXZlbCAqIEBzb25nLnRyYWNrcy5yZWR1Y2UoKG1lbW8sIHRyYWNrKSA9PlxuICAgICAgbWVtbyArIFRyYWNrLnNhbXBsZSBAc3RhdGUsIEBzYW1wbGVzLCB0cmFjaywgdGltZSwgaVxuICAgICwgMClcblxuICAjIGNhbGxlZCBmb3IgZXZlcnkgY2xvY2tSYXRpbyBzYW1wbGVzXG4gIHRpY2s6ICh0aW1lLCBpKSA9PlxuICAgIGJwcyA9IEBzb25nLmJwbSAvIDYwXG4gICAgYmVhdCA9IHRpbWUgKiBicHNcblxuICAgIEBzb25nLnRyYWNrcy5mb3JFYWNoICh0cmFjaywgaW5kZXgpID0+XG5cbiAgICAgICMgZm9yIG5vdyBzZW5kIG1pZGkgb25seSB0byB0aGUgZmlyc3QgdHJhY2sgLSBpbiB0aGUgZnV0dXJlIHdlIHNob3VsZFxuICAgICAgIyBhbGxvdyB0cmFja3MgdG8gYmUgYXJtZWQgZm9yIHJlY29yZGluZ1xuICAgICAgbWlkaU1lc3NhZ2VzID0gaWYgaW5kZXggaXMgQHNvbmcuc2VsZWN0ZWRUcmFjayB0aGVuIEBtaWRpTWVzc2FnZXMgZWxzZSBudWxsXG5cbiAgICAgIFRyYWNrLnRpY2sgQHN0YXRlLCB0cmFjaywgbWlkaU1lc3NhZ2VzLCB0aW1lLCBpLCBiZWF0LCBAbGFzdEJlYXQsIGJwc1xuXG4gICAgQGxhc3RCZWF0ID0gYmVhdFxuXG4gICMgc3RvcmUgc2FtcGxlIGRhdGEgZm9yIGEgbmV3IHNhbXBsZVxuICBhZGRTYW1wbGU6IChpZCwgc2FtcGxlRGF0YSkgLT5cbiAgICBAc2FtcGxlc1tpZF0gPSBzYW1wbGVEYXRhXG5cbiAgIyByZWxlYXNlIGRhdGEgZm9yIGEgc2FtcGxlXG4gIHJlbW92ZVNhbXBsZTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAc2FtcGxlc1tpZF1cblxuICAjIGNhbGxlZCBwZXJpb2RpY2FsbHkgdG8gcGFzcyBoaWdoIGZyZXF1ZW5jeSBkYXRhIHRvIHRoZSB1aS4uIHRoaXMgc2hvdWxkXG4gICMgZXZlbnR1YWxseSBiZSB1cGRhdGVkIHRvIGJhc2UgdGhlIGFtb3VudCBvZiBkZWNheSBvbiB0aGUgYWN0dWFsIGVscGFzZWQgdGltZVxuICBwcm9jZXNzRnJhbWU6IC0+XG4gICAgaWYgQHNvbmc/LnRyYWNrcz9cbiAgICAgICMgYXBwbHkgZGVjYXkgdG8gbWV0ZXIgbGV2ZWxzXG4gICAgICBmb3IgdHJhY2sgaW4gQHNvbmcudHJhY2tzXG4gICAgICAgIGlmIEBzdGF0ZVt0cmFjay5faWRdP1xuICAgICAgICAgIEBzdGF0ZVt0cmFjay5faWRdLm1ldGVyTGV2ZWwgLT0gbWV0ZXJEZWNheVxuXG4gICMgZ2V0IGEgc2VuZGFibGUgdmVyc2lvbiBvZiBjdXJyZW50IHNvbmcgcGxheWJhY2sgc3RhdGVcbiAgZ2V0U3RhdGU6IC0+XG4gICAgbWV0ZXJMZXZlbHM6IEBzb25nPy50cmFja3M/LnJlZHVjZSgobWVtbywgdHJhY2spID0+XG4gICAgICBtZW1vW3RyYWNrLl9pZF0gPSBAc3RhdGVbdHJhY2suX2lkXT8ubWV0ZXJMZXZlbFxuICAgICAgbWVtb1xuICAgICwge30pXG5cbiIsImluc3RydW1lbnRUeXBlcyA9XG4gIEFuYWxvZ1N5bnRoZXNpemVyOiByZXF1aXJlICcuL2FuYWxvZ19zeW50aGVzaXplcidcbiAgQmFzaWNTYW1wbGVyOiByZXF1aXJlICcuL2Jhc2ljX3NhbXBsZXInXG4gIERydW1TYW1wbGVyOiByZXF1aXJlICcuL2RydW1fc2FtcGxlcidcbiAgRHJ1bVN5bnRoZXNpemVyOiByZXF1aXJlICcuL2RydW1fc3ludGhlc2l6ZXInXG4gIExvb3BTYW1wbGVyOiByZXF1aXJlICcuL2xvb3Bfc2FtcGxlcidcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRyYWNrXG5cbiAgQGNyZWF0ZVN0YXRlOiAoc3RhdGUsIHRyYWNrKSAtPlxuICAgIHN0YXRlW3RyYWNrLl9pZF0gPVxuICAgICAgbWV0ZXJMZXZlbDogMFxuXG4gIEByZWxlYXNlU3RhdGU6IChzdGF0ZSwgdHJhY2spIC0+XG4gICAgZGVsZXRlIHN0YXRlW3RyYWNrLl9pZF1cblxuICBAc2FtcGxlOiAoc3RhdGUsIHNhbXBsZXMsIHRyYWNrLCB0aW1lLCBpKSAtPlxuICAgICMgZ2V0IGluc3RydW1lbnQgb3V0cHV0XG4gICAgSW5zdHJ1bWVudCA9IGluc3RydW1lbnRUeXBlc1t0cmFjay5pbnN0cnVtZW50Ll90eXBlXVxuICAgIHNhbXBsZSA9IEluc3RydW1lbnQuc2FtcGxlIHN0YXRlLCBzYW1wbGVzLCB0cmFjay5pbnN0cnVtZW50LCB0aW1lLCBpXG5cbiAgICAjIGFwcGx5IGVmZmVjdHNcbiAgICBzYW1wbGUgPSB0cmFjay5lZmZlY3RzLnJlZHVjZSgoc2FtcGxlLCBlZmZlY3QpIC0+XG4gICAgICBFZmZlY3Quc2FtcGxlIHN0YXRlLCBlZmZlY3QsIHRpbWUsIGksIHNhbXBsZVxuICAgICwgc2FtcGxlKVxuXG4gICAgIyB1cGRhdGUgbWV0ZXIgbGV2ZWxzXG4gICAgaWYgdHJhY2tTdGF0ZSA9IHN0YXRlW3RyYWNrLl9pZF1cbiAgICAgIGxldmVsID0gdHJhY2tTdGF0ZS5tZXRlckxldmVsXG4gICAgICBpZiBub3QgbGV2ZWw/IG9yIGlzTmFOKGxldmVsKSBvciBzYW1wbGUgPiBsZXZlbFxuICAgICAgICB0cmFja1N0YXRlLm1ldGVyTGV2ZWwgPSBzYW1wbGVcblxuICAgIHNhbXBsZVxuXG4gIEB0aWNrOiAoc3RhdGUsIHRyYWNrLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGksIGJlYXQsIGxhc3RCZWF0LCBicHMpIC0+XG4gICAgQGNyZWF0ZVN0YXRlIHN0YXRlLCB0cmFjayB1bmxlc3Mgc3RhdGVbdHJhY2suX2lkXT9cblxuICAgIEluc3RydW1lbnQgPSBpbnN0cnVtZW50VHlwZXNbdHJhY2suaW5zdHJ1bWVudC5fdHlwZV1cblxuICAgICMgZ2V0IG5vdGVzIG9uIGZyb20gc2VxdWVuY2VcbiAgICB7bm90ZXNPbiwgbm90ZXNPZmZ9ID0gQG5vdGVzIHRyYWNrLnNlcXVlbmNlLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGJlYXQsIGxhc3RCZWF0XG5cbiAgICBJbnN0cnVtZW50LnRpY2sgc3RhdGUsIHRyYWNrLmluc3RydW1lbnQsIHRpbWUsIGksIGJlYXQsIGJwcywgbm90ZXNPbiwgbm90ZXNPZmZcbiAgICB0cmFjay5lZmZlY3RzLmZvckVhY2ggKGUpIC0+IGUudGljayBzdGF0ZSwgdGltZSwgYmVhdCwgYnBzXG5cbiAgIyBsb29rIGF0IHNlcXVlbmNlIGFuZCBtaWRpIG1lc3NhZ2VzLCByZXR1cm4gYXJyYXlzIG9mIG5vdGVzIG9uIGFuZCBvZmZcbiAgIyBvY2N1cnJpbmcgaW4gdGhpcyB0aWNrXG4gIEBub3RlczogKHNlcXVlbmNlLCBtaWRpTWVzc2FnZXMsIHRpbWUsIGJlYXQsIGxhc3RCZWF0KSAtPlxuICAgIGJhciA9IE1hdGguZmxvb3IgYmVhdCAvIHNlcXVlbmNlLmxvb3BTaXplXG4gICAgbGFzdEJhciA9IE1hdGguZmxvb3IgbGFzdEJlYXQgLyBzZXF1ZW5jZS5sb29wU2l6ZVxuICAgIGJlYXQgPSBiZWF0ICUgc2VxdWVuY2UubG9vcFNpemVcbiAgICBsYXN0QmVhdCA9IGxhc3RCZWF0ICUgc2VxdWVuY2UubG9vcFNpemVcblxuICAgIG5vdGVzT24gPSBbXVxuICAgIG5vdGVzT2ZmID0gW11cblxuICAgIGZvciBpZCwgbm90ZSBvZiBzZXF1ZW5jZS5ub3Rlc1xuICAgICAgc3RhcnQgPSBub3RlLnN0YXJ0XG4gICAgICBlbmQgPSBub3RlLnN0YXJ0ICsgbm90ZS5sZW5ndGhcbiAgICAgIGlmIHN0YXJ0IDwgYmVhdCBhbmQgKHN0YXJ0ID49IGxhc3RCZWF0IG9yIGJhciA+IGxhc3RCYXIpXG4gICAgICAgIG5vdGVzT24ucHVzaCB7a2V5OiBub3RlLmtleX1cbiAgICAgIGlmIGVuZCA8IGJlYXQgYW5kIChlbmQgPj0gbGFzdEJlYXQgb3IgYmFyID4gbGFzdEJhcilcbiAgICAgICAgbm90ZXNPZmYucHVzaCB7a2V5OiBub3RlLmtleX1cblxuICAgIGlmIG1pZGlNZXNzYWdlcz9cbiAgICAgIG1pZGlNZXNzYWdlcy5mb3JFYWNoIChtZXNzYWdlLCBpKSAtPlxuICAgICAgICBpZiBtZXNzYWdlLnRpbWUgPCB0aW1lXG4gICAgICAgICAgbWlkaU1lc3NhZ2VzLnNwbGljZSBpLCAxXG4gICAgICAgICAgc3dpdGNoIG1lc3NhZ2UudHlwZVxuICAgICAgICAgICAgd2hlbiAnb24nXG4gICAgICAgICAgICAgIG5vdGVzT24ucHVzaCBrZXk6IG1lc3NhZ2Uua2V5XG4gICAgICAgICAgICB3aGVuICdvZmYnXG4gICAgICAgICAgICAgIG5vdGVzT2ZmLnB1c2gga2V5OiBtZXNzYWdlLmtleVxuXG4gICAge25vdGVzT24sIG5vdGVzT2ZmfVxuIl19
