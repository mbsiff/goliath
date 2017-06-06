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
    obj.getBit = i => bits.getBit(i);
<<<<<<< HEAD
    obj.countBits = () => bits.countBits();
=======
>>>>>>> c0d8bde68970f624e87a2b36879e79b5315dc8c8
    return obj;
  }

  function _add(x,y){
    let n = Math.max(x.countBits(), y.countBits());
    let z = BB.makeBits(n + 1);
    let carry = 0;
    for(let i = 0; i < n; i++){
      let total = x.getBit(i) + y.getBit(i) + carry;
      let sum = total % 2;
      z.setBit(i, sum);
      carry = (total - sum) / 2;
    }
    z.setBit(n, carry);
    return _make(z);
  }

  function _shiftLeft(x, n){
    let c = x.countBits() + n;
    let y = BB.makeBits(c);
    let j = 0;
    for (let i = n; i < c; i++){
      y.setBit(i, x.getBit(j));
      j++;
    }
    return y;
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
    let i = 0;
    let b = ZERO;
    var x;
    while (i < s.length){
      x = parseFloat(s.charAt(i));
      b = _add(b, makeFromNumber(x));
      if (i + 1 < s.length){
        b = _add(_shiftLeft(b, 2), b);
        b = _shiftLeft(b, 1);
      }
      i ++;
    }
    return _make(b);
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
        throw new TypeError("Can't convert a fractional number");
      }
    } else if (typeof x === 'string') {
        return makeFromString(x);
    } else {
      throw new TypeError("This type of input is not currently supported");
    }
  }

  function add(x, y){
    return _make(_add(x.makeImmutable(), y.makeImmutable()));
  }

  function _compareTo(x, y){
    let m = x.countBits();
    let n = y.countBits();
    if (m > n){
      return 1;
    } else if (n > m){
      return -1;
    } else {
      for (let i = n; i >= 0; i--) {
        let p = x.getBit(i);
        let q = y.getBit(i);
        if (p > q){
          return 1;
        } else if (q > p){
          return -1;
        }
      }
      return 0;
    }
  }

  function compareTo(x, y){
    return _compareTo(x.makeImmutable(), y.makeImmutable());
  }

  exports.add = add;
  exports.compareTo = compareTo;
  exports.make = make;
  exports.ZERO = ZERO;
  exports.ONE = ONE;
})((typeof exports === 'undefined') ? this.xint = {} : exports);
