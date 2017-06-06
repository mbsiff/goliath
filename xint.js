(function(exports){
  'use strict';
  var BB = require('./bitBlocks');

  const ZERO = makeFromNumber(0);
  const ONE  = makeFromNumber(1);

  function bitsToBinaryString(bits) {
    let s = '';
    let n = bits.countBits();
    for (let i=0; i < n; i++) {
      s = bits.getBit(i) + s;
    }
    return s;
  }

  function _make(bits) {
    let obj = {};
    obj.toBinaryString = () => bitsToBinaryString(bits);
    return obj;
  }

  function makeFromNumber(n) {
    if (n === 0) {
      return _make(BB.makeBits(1));
    }
    let size = 0;
    let m = n;
    while (m > 0) {
      m = Math.floor(m / 2);
      size++;
    }
    let bits = BB.makeBits(size);
    m = n;
    for (let i = 0; i < size; i++){
      BB.setBit(bits, i, m % 2);
      m = Math.floor(m / 2);
    }
    return _make(bits);
  }

  function makeFromString(s) {
    return null;   // !!!
  }

  function make(x){
    if (typeof x === 'number'){
      if (x % 1 === 0) {
        if (x === 0) {
          return ZERO;
        } else if (x === 1) {
          return ONE;
        }
        if (x > Number.MAX_SAFE_INTEGER) {
          console.warn('...');
        }
        return makeFromNumber(x);
      } else {
        // throw ...
      }
    } else if (typeof x === 'string') {
      return makeFromString(x);
    } else {
      throw new TypeError("This type of input is not currently supported");
    }
  }

  exports.make = make;
  exports.ZERO = ZERO;
  exports.ONE = ONE;
})((typeof exports === 'undefined') ? this.xint = {} : exports);
