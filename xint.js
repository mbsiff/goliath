(function(exports){
  'use strict';
  var BB = require('./bitBlocks');

  const BLOCK_SIZE = BB.getBlockSize();
  const CEILING = 1 << BLOCK_SIZE;

  const ZERO = _make(makeFromNumber(0));
  const ONE  = _make(makeFromNumber(1));

  function bitsToTen(x){
    var i = 0;
    var t = 0;
    while (i <= BB.countBits(x)){
      if (BB.getBit(x, i) === 1){
        t += Math.pow(2, i);
      }
      i++;
    }
    return t;
  }

  function bitsToBinaryString(bits) {
    let s = '';
    let n = bits.countBits();
    for (let i=0; i < n; i++) {
      s = bits.getBit(i) + s;
    }
    return s;
  }

  function bitsToDecimalString(c){
    let digits = [];
    let ten = make(10);
    let n = c;
    if (c.countBits() === 1 && bitsToTen(c) === 0){
      return '0';
    } else {
      while (gt(n, ZERO)){
        let x = divmod(n, ten);
        let r = x.r;
        n = x.q;
        digits.push(bitsToTen(r));
      }
      return digits.reverse().join("");
    }
  }

  function _make(bits) {
    let obj = {};
    obj.toBinaryString = () => bitsToBinaryString(bits);
    obj.getBit = i => bits.getBit(i);
    obj.getBlock = i => bits.getBlock(i)
    obj.countBits = () => bits.countBits();
    obj.countBlocks = () => bits.countBlocks();
    obj.toString = () => bitsToDecimalString(bits);
    return obj;
  }

  function _compareTo(x, y){
    let m = x.countBits();
    let n = y.countBits();
    if (m > n) {
      return 1;
    } else if (m < n){
      return -1;
    } else {
      for(let i = m; i > 0; i--){
        let a = x.getBit(i);
        let b = y.getBit(i);
        if (a > b){
          return 1;
        } else if (b > a){
          return -1;
        }
      }
      return 0;
    }
  }

  function rand(k){
    let x = BB.makeBits(k);
    for (let i = 0; i < k; i++) {
      x.setBit(i, Math.floor(1.5*Math.random()));
    }
    return _make(x);
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

  function _blockAdd(x,y){
    let n = Math.max(x.countBlocks(), y.countBlocks());
    let z = BB.makeBlocks(n + 1);
    let carry = 0;
    for(let i = 0; i < n; i++){
      let total = x.getBlock(i) + y.getBlock(i) + carry;
      let sum = total % CEILING;
      z.setBlock(i, sum);
      carry = Math.floor(total / CEILING);
    }
    z.setBlock(n, carry);
    z.trim();
    return _make(z);
  }


  function _sub(x, y) {
      let n = Math.max(x.countBits(), y.countBits());
      let z = BB.makeBits(n);
      let borrow = 0;
      for (let i = 0; i < n; i++) {
          let difference = (x.getBit(i) - borrow) - y.getBit(i);
          if (difference < 0) {
              borrow = 1;
              difference = difference + 2;   // 2 since we are using base 2
          } else {
              borrow = 0;
          }
          z.setBit(i, difference);
      }
      return _make(z);
  }

  function _mult(x, y){
    let m = x.countBits();
    let n = y.countBits();
    let z = BB.makeBits(m + n);
    let carry = 0;
    let k = 0;
    for (let j = 0; j < n; j++){
      k = j;
      carry = 0;
      if (y.getBit(j)){
        for (let i = 0; i < m; i++){
          let total = x.getBit(i) * y.getBit(j) + z.getBit(k) + carry;
          let sum = total % 2;
          z.setBit(k, sum);
          carry = (total - sum) / 2;
          k++;
        }
        z.setBit(k, carry);
      }
    }
    return _make(z);
  }

  function _blockMult(x, y){
    let m = x.countBlocks();
    let n = y.countBlocks();
    let z = BB.makeBlocks(m + n);
    let carry = 0;
    let k = 0;
    for (let j = 0; j < n; j++){
      k = j;
      carry = 0;
      if (y.getBlock(j)){
        for (let i = 0; i < m; i++){
          let total = x.getBlock(i) * y.getBlock(j) + z.getBlock(k) + carry;
          let sum = total % CEILING;
          z.setBlock(k, sum);
          carry = Math.floor(total / CEILING);
          k++;
        }
        z.setBlock(k, carry);
      }
    }
    z.trim();
    return _make(z);
  }


  function _divmod(x,y){
    if (y.countBits() === 1 && y.getBit(0) === 0){
      throw new RangeError("Can't divide by 0!");
    } else {
      let i  = x.countBits();
      let rem = ZERO;
      let quo = ZERO;
      while (i >= 0){
        rem = _shiftLeft(rem, 1);
        rem.setBit(0, x.getBit(i));
        quo = _shiftLeft(quo, 1);
        if (leq(y, rem)){
          rem = sub(rem, y);
          quo.setBit(0, 1);
        }
        i --;
      }
      return {q: _make(quo), r: _make(rem)};
    }
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
      return BB.makeBits(1);
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
    return bits;
  }

  function makeFromString(s) {
    let i = 0;
    let b = BB.makeBits(1);
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
    return b;
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
        return _make(makeFromNumber(x));
      } else {
        throw new TypeError("Can't convert a fractional number");
      }
    } else if (typeof x === 'string') {
        return _make(makeFromString(x));
    } else {
      throw new TypeError("This type of input is not currently supported");
    }
  }

  function add(x, y){
    // eventually, handle signs
    return _make(_add(x, y));
  }

  function blockAdd(x, y) {
      return _make(_blockAdd(x, y));
  }

  function sub(x, y){
    return _make(_sub(x, y));
  }

  function mult(x, y){
    return _make(_mult(x, y));
  }

  function blockMult(x,y){
    return _make(_blockMult(x,y));
  }

  function divmod(x, y){
    return _divmod(x, y);
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

  function compareTo(x, y) {
    // eventually, handle signs
    return _compareTo(x, y);
  }

  function lt(x, y){
    return compareTo(x, y) === -1
  }

  function gt(x, y){
    return compareTo(x, y) === 1
  }

  function eq(x, y){
    return compareTo(x, y) === 0
  }

  function leq(x, y){
    return compareTo(x, y) !== 1
  }

  function geq(x, y){
    return compareTo(x, y) !== -1
  }


  exports.rand = rand;
  exports.add = add;
  exports.blockAdd = blockAdd;
  exports.sub = sub;
  exports.mult = mult;
  exports.blockMult = blockMult;
  exports.divmod = divmod;
  exports.compareTo = compareTo;
  exports.lt = lt;
  exports.gt = gt;
  exports.leq = leq;
  exports.geq = geq;
  exports.eq = eq;
  exports.make = make;
  exports.ZERO = ZERO;
  exports.ONE = ONE;
})((typeof exports === 'undefined') ? this.xint = {} : exports);
