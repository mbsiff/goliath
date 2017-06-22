// arbitrary precision (unsigned) integers
// using resizable typed arrays
// mutable!
// little endian

let assert = require('assert');

(function(exports){
  'use strict';

  const BITS_PER_BLOCK = 16;
  const BLOCK_MASK = BITS_PER_BLOCK - 1;
  const BASE_MASK = (1 << BITS_PER_BLOCK) - 1;
  const LOG_BLOCK_SIZE = 4;

  const SHORT_LIMIT = 1 << BITS_PER_BLOCK;
  const BASE = SHORT_LIMIT;

  const DEFAULT_SIZE = 1000;

  // -----------------------------------------------------------
  // allocate and initialize new numbers

  function _allocate(size) {
    let obj = {};
    obj.a = new Uint16Array(2 * size);
    obj.n = 1;
    obj.sign = 1;
    obj.toString = function (radix = 10) {
      return toString(this, radix);
    };
    return obj;
  }

  function make(x=0) {
    if (typeof x === 'number') {
      if (Number.isSafeInteger(x)) {
        return _fromInt(x);
      } else {
        throw new RangeError('invalid numerical source: ' + x);
      }
    } else if (typeof x === 'string') {
      let decRe = /^(0|-?[1-9][0-9]*)$/;
      let hexRe = /^0x(0|[1-9a-f][0-9a-f]*)$/i;  // no sign allowed
      let binRe = /^0b(0|1[01]*)$/;  // no sign allowed
      if (decRe.test(x)) {
        return _fromDecString(x);
      } else if (hexRe.test(x)) {
        return _fromHexString(x.slice(2));  // !!!
      } else if (binRe.test(x)) {
        return _fromBinString(x.slice(2));
      } else {
        throw new RangeError('cannot convert from string "' + x + '"');
      }
    } else {
      throw new TypeError('invalid source');
    }
  }

  function _fromInt(n) {
    let maxBits = 1 + Math.log2(Number.MAX_SAFE_INTEGER);
    let x = _allocate(Math.ceil(maxBits / BITS_PER_BLOCK));
    if (n < 0) {
      n = -n;
      x.sign = -1;
    }
    let i = 0;
    while (n) {
      x.a[i] = n % BASE;
      n = Math.floor(n / BASE);
      i++;
    }
    x.n = (i > 0) ? i : 1;
    return x;
  }

  // assumes digits well-formed
  function _fromDecString(digits) {
    let x = _allocate(Math.ceil(digits.length / 4));
    if (digits.charAt(0) === '-') {
      x.sign = -1;
      digits = digits.slice(1);
    }
    for (let digit of digits) {
      mulSmall(x, 10);
      _uAddSmall(x, digit.charCodeAt(0) - 48);   // 48 is ASCII for '0'
    }
    return x;
  }

  // assumes bits is well-formed string of 0s and 1s
  function _fromBinString(bits) {
    let nBlocks = Math.ceil(bits.length / BITS_PER_BLOCK);
    let x = _allocate(nBlocks);
    x.n = nBlocks;
    let j = bits.length - 1;
    for (let i = 0; i < bits.length; i++) {
      if (bits.charAt(j) === '1') {
        x.setBit(i);
      }
      j--;
    }
    return x;
  }

  // assumes hex is well-formed string of hex digits, no sign nor leading 0
  function _fromHexString(hex) {
    let nBlocks = Math.ceil(hex.length * 4 / BITS_PER_BLOCK);
    let x = _allocate(nBlocks);
    for (let h of hex) {
      mulSmall(x, 16);
      _uAddSmall(x, parseInt(h, 16));
    }
    return x;
  }


  // -----------------------------------------------------------
  // converting back to strings (and numbers if possible)

  function toSmall(x) {
    return (x.n === 1) ? (x.sign * x.a[0]) : NaN;
  }

  function toString(x, radix=10) {
    if (isZero(x)) {
      return '0';
    }
    let s = '';
    if (radix === 10) {
      s = _toDecString(x);
    } else if (radix === 2 || radix == 16) {
      let radixLog = Math.log2(radix);
      for(let i = 0; i < x.n; i++) {
        let b = x.a[i];
        for (let j = 0; j < BITS_PER_BLOCK; j += radixLog) {
          s = (b & (radix - 1)).toString(radix) + s;
          b = b >>> radixLog;
        }
      }
    } else {
      throw new RangeError('conversion not defined for radix ' + radix);
    }
    if (s.length > 1) {
      s = s.replace(/^0*/, '');
    }
    if (x.sign < 0) {
      s = '-' + s;
    }
    return s;
  }

  // uses t local to the function, so allocated only once
  var _toDecString;
  {
    let t = _allocate(DEFAULT_SIZE);
    _toDecString = function (x) {
      copy(x, t);
      let s = '';
      while (!isZero(t)) {
        let d = divSmall(t, 10);
        s = d + s;
      }
      return s;
    };
  }


  // -----------------------------------------------------------

  // copies src into dst reallocating if necessary; returns dst
  function copy(src, dst) {
    _resize(dst, src.n);
    dst.a.set(src.a.subarray(0, src.n));
    return dst;
  }

  function _resize(x, newSize) {
    x.n = newSize;
    if (newSize > x.a.length) {
      _extend(x, newSize);
    }
    return x;
  }

  function _extend(x, newSize) {
    let newBlocks = new Uint16Array(2 * newSize);
    newBlocks.set(x.a);
    x.a = newBlocks;
  }

  function _appendBlock(x, b) {
    _resize(x, x.n + 1);
    x.a[x.n - 1] = b;
  }

  function _setToSmall(x, n) {
    x.a[0] = n;
    x.n = 1;
    x.sign = n ? Math.sign(n) : 1;
  }

  function _trim(x) {
    while (x.n > 1 && x.a[x.n-1] === 0) {
      x.n--;
    }
  }

  function _setZeroSign(x) {
    if (x.sign === -1 && x.n === 1 && x.a[0] === 0) {
      x.sign = 1;
    }
    return x;
  }


  // -----------------------------------------------------------
  // bits

  // returns number of bits in unsigned x
  // (0 requires 1 bit)
  function countBits(x) {
    let bits = ((x.n - 1) * BITS_PER_BLOCK) + 1;
    let y = x.a[x.n - 1];
    while (y >= 2) {
      bits++;
      y >>>= 1;
    }
    return bits;
  }

  function _setBit(x, i, value=1) {
    const offset = i & BLOCK_MASK;
    const n = i >>> LOG_BLOCK_SIZE;
    if (n < x.n) {
      if (value) {
        x.a[n] |= (1 << offset);
      } else {
        x.a[n] &= (~ (1 << offset));
      }
    } else {
      throw new RangeError('bit index ' + i + ' is out of bounds');
    }
  }

  function _getBit(x, i) {
    const offset = i & BLOCK_MASK;
    const n = i >>> LOG_BLOCK_SIZE;
    if (n < x.n && (x.a[n] & (1 << offset))) {
      return 1;
    } else {
      return 0;
    }
  }

  // randomizes x into a k-bit number
  // sets sign to be non-negative
  function randomize(x, k) {
    let size = Math.ceil(k / BITS_PER_BLOCK);
    _resize(x, size);
    x.a.fill(0, 0, x.n);
    for (let i = 0; i < k; i++) {
      if (Math.random() < 0.5) {
        _setBit(x, i, 1);
      }
    }
    _trim(x);
    return x;
  }


  // -----------------------------------------------------------
  // comparison

  var isZero = x => (x.n === 1) && (x.a[0] === 0);
  var isOne = x => (x.n === 1) && (x.sign === 1) && (x.a[0] === 1);

  var isSmall = x => (x.n === 1);

  var eqSmall = (x, n) => (x.n === 1) && (n === x.sign * x.a[0]);

  function _uCompare(x, y) {
    let n = x.n;
    let d = n - y.n;
    for (let i = n - 1; d === 0 && i >= 0; i--) {
      d = x.a[i] - y.a[i];
    }
    return Math.sign(d);
  }

  function compare(x, y) {
    if (x.sign === y.sign) {
      if (x.sign === 1) {
        return _uCompare(x, y);
      } else {
        return _uCompare(y, x);
      }
    } else {
      return x.sign;
    }
  }

  let eq = (x, y) => compare(x, y) === 0;
  let neq = (x, y) => compare(x, y) !== 0;
  let gt = (x, y) => compare(x, y) > 0;
  let lt = (x, y) => compare(x, y) < 0;
  let gte = (x, y) => compare(x, y) >= 0;
  let lte = (x, y) => compare(x, y) <= 0;


  // -----------------------------------------------------------
  // shifting

  // shifts x "right" by k bits into y
  // if y not specified, shifts x in place
  function shiftRight(x, k, y) {
    y = y ? _resize(y, x.n) : x;
    let kBar = BITS_PER_BLOCK - k;
    let lopped = 0;
    for (let i = x.n - 1;  i >= 0; i--) {
      let b = x.a[i];
      y.a[i] = (b >>> k) | lopped;
      lopped = b << kBar;
    }
    if (y.n > 1 && y.a[y.n - 1] === 0) {
      y.n--;
    }
    return y;
  }

  // shifts x "left" by k bits into y
  // if y not specified, shifts x in place
  function shiftLeft(x, k, y) {
    y = y ? _resize(y, x.n) : x;
    let kMask = (1 << k) - 1;
    let kBar = BITS_PER_BLOCK - k;
    let lopped = 0;
    for (let i = 0; i < x.n; i++) {
      let b = x.a[i];
      let t = (b >>> kBar) & kMask;
      y.a[i] = (b << k) | lopped;
      lopped = t;
    }
    if (lopped) {
      _appendBlock(y, lopped);
    }
    return y;
  }


  // -----------------------------------------------------------
  // addition

  // increments x
  // if start is specified increments starting from that block
  function _uIncrement(x, start=0) {
    let carry = 1;
    for (let i=start; carry && i < x.n; i++) {
      let total = x.a[i] + 1;
      x.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
    }
    if (carry) {
      _appendBlock(x, 1);
    }
    return x;
  }

  function increment(x) {
    if (x.sign === 1) {
      _uIncrement(x);
    } else {
      _uDecrement(x);
      _setZeroSign(x);
    }
    return x;
  }

  // assumes n is small, n >= 0
  function _uAddSmall(x, n) {
    let total = x.a[0] + n;
    x.a[0] = total & BASE_MASK;
    if (total >>> BITS_PER_BLOCK) {
      _uIncrement(x, 1);
    }
    return x;
  }

  // adds y into x
  function _uAdd(x, y) {
    _resize(x, Math.max(x.n, y.n));
    let carry = 0;
    for (let i = 0; i < y.n; i++) {
      let total = x.a[i] + y.a[i] + carry;
      x.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
    }
    if (carry) {
      _uIncrement(x, y.n);
    }
    return x;
  }

  var add2;
  {
    let t = _allocate(DEFAULT_SIZE);
    add2 = function (x, y) {
      assert (x !== y);
      if (x.sign === y.sign) {
        _uAdd(x, y);  // sign remains
      } else {
        if (_uCompare(x, y) >= 0) {
          _uSub(x, y);
          _setZeroSign(x);
        } else {
          copy(y, t);
          _uSub(t, x);
          copy(t, x);
          negate(x);
        }
      }
      return x;
    };
  }

  function add3(x, y, z) {
    assert (x !== z && y !== z);
    if (x.sign === y.sign) {
      copy(x, z);  // z's sign is x's
      _uAdd(z, y);
    } else {
      if (_uCompare(x, y) >= 0) {
        copy(x, z);  // z's sign is x's
        _uSub(z, y);
        _setZeroSign(z);
      } else {
        copy(y, z);  // z's sign is y's sign
        _uSub(z, x);
      }
    }
    return z;
  }


  // -----------------------------------------------------------
  // subtraction

  function negate(x) {
    if (x.n > 1 || x.a[0]) {
      x.sign = -x.sign;
    }
    return x;
  }

  // unsigned decrement, assumes x > 0
  // starting from block start
  function _uDecrement(x, start = 0) {
    let borrow = 1;
    let b = 0;
    for (let i = start; borrow && i < x.n; i++) {
      b = x.a[i];
      if (b) {
        x.a[i] = b - 1;
        borrow = 0;
      } else {
        x.a[i] = BASE - 1;
        borrow = 1;
      }
    }
    if (borrow) {
      throw new Error('cannot decrement 0');
    }
    if (x.n > 1 && b === 1) {
      x.n--;
    }
    return x;
  }

  function decrement(x) {
    if (isZero(x)) {
      x.a[0] = 1;
      x.sign = -1;
    } else if (x.sign === 1) {
      _uDecrement(x);
    } else {
      _uIncrement(x);
    }
    return x;
  }

  // unsigned subtract y from x
  // assumes y <= x
  function _uSub(x, y) {
    let borrow = 0;
    let i = 0;
    while (i < y.n) {
      let diff = x.a[i] - y.a[i] - borrow;
      if (diff < 0) {
        x.a[i] = diff + BASE;
        borrow = 1;
      } else {
        x.a[i] = diff;
        borrow = 0;
      }
      i++;
    }
    if (borrow) {
      if (i < x.n) {
        _uDecrement(x, i);
      } else {
        throw new Error('subtrahend greater than minuend');
      }
    }
    _trim(x);
  }

  var sub2;
  {
    let t = _allocate(DEFAULT_SIZE);
    sub2 = function (x, y) {
      assert(x !== y);
      if (x.sign === y.sign) {
        if (_uCompare(x, y) >= 0) {
          _uSub(x, y);
          _setZeroSign(x);
        } else {
          copy(y, t);
          _uSub(t, x);
          copy(t, x);
          negate(x);
        }
      } else {
        if (_uCompare(x, y) >= 0) {
          _uAdd(x, y);
        } else {
          copy(y, t);
          _uAdd(t, x);
          copy(t, x);
          negate(x);
        }
      }
      return x;
    };
  }

  // this currently does NOT work if z is y
  function sub3(x, y, z) {
    assert(x !== z && y !== z);
    if (x.sign === y.sign) {
      if (_uCompare(x, y) >= 0) {
        copy(x, z);
        _uSub(z, y);
        _setZeroSign(z);
      } else {
        copy(y, z);
        _uSub(z, x);
        negate(z);
      }
    } else {
      if (_uCompare(x, y) >= 0) {
        copy(x, z);
        _uAdd(z, y);
      } else {
        copy(y, z);
        _uAdd(z, x);
        negate(z);
      }
    }
    return z;
  }


  // -----------------------------------------------------------
  // multiplication


  // multiplies x by small n into y
  // if y not specified, multiplies in place
  function mulSmall(x, n, y) {
    y = y ? _resize(y, x.n) : x;
    if (n === 0) {
      _setToSmall(y, 0);
    } else {
      let carry = 0;
      for (let i = 0; i < x.n; i++) {
        let total = x.a[i] * n + carry;
        y.a[i] = total & BASE_MASK;
        carry = total >> BITS_PER_BLOCK;
      }
      if (carry) {
        _appendBlock(y, carry);
      }
      y.sign = x.sign * Math.sign(n);
    }
    return y;
  }

  // unsigned multiplication: z = x * y
  // assumes z !== x, z !== y
  function _uMul(x, y, z) {
    _resize(z, x.n + y.n);
    z.a.fill(0, 0, z.n);
    let carry = 0;
    let k = 0;
    for (let i = 0; i < y.n; i++){
      k = i;
      carry = 0;
      let b = y.a[i];
      if (b) {
        for (let j = 0; j < x.n; j++) {
          let t = x.a[j] * b + z.a[k] + carry;
          z.a[k] = t & BASE_MASK;
          carry = t >>> BITS_PER_BLOCK;
          k++;
        }
        z.a[k] = carry;
      }
    }
    _trim(z);
    return z;
  }

  function mul(x, y, z) {
    if (isZero(x) || isZero(y)) {
      _setToSmall(z, 0);
    } else {
      assert (x !== z && y !== z);
      _uMul(x, y, z);
      z.sign = x.sign * y.sign;
    }
    return z;
  }


  // -----------------------------------------------------------
  // division

  // divides x by small n
  // writes quotient into y
  // if y not specified, quotient written into x
  // assumes n > 0
  // buggy if y specified but not cleared???
  function divSmall(x, n, y) {
    y = y ? _resize(y, x.n) : x;
    let rem = 0;
    for (let i = x.n - 1; i >= 0; i--) {
      let high = rem;
      let low = x.a[i];
      let v = high * (1 << BITS_PER_BLOCK) + low;
      let q = Math.floor(v / n);
      y.a[i] = q;
      rem = v - (q * n);
    }
    _trim(y);
    return rem;
  }

  // not sure if this version is needed any more
  // function modSmall(x, m) {
  //   let sum = 0;
  //   for (let i = 0; i < x.n; i++) {
  //     sum = (sum + x.a[i] * _modExpSmall(BASE, i, m)) % m;
  //   }
  //   return sum;
  // }

  // division is via bits, not via blocks
  // it is possible to emulate long division over blocks using
  // a sort of Newton's Method/binary search to do single step
  // but seems at least as expensive if not more than this way

  // sets q, r as: dividend = divisor*q + r
  // assumes divisor !== 0
  function _uDiv(dividend, divisor, q, r) {
    _setToSmall(r, 0);
    _setToSmall(q, 0);
    for (let i = countBits(dividend); i >= 0; i--) {
      shiftLeft(r, 1);
      _setBit(r, 0, _getBit(dividend, i));
      shiftLeft(q, 1);
      if (_uCompare(divisor, r) <= 0) {
        _uSub(r, divisor);
        _setBit(q, 0, 1);
      }
    }
  }

  function div(dividend, divisor, q, r) {
    if (!isZero(divisor)) {
      if (isZero(dividend)) {
        _setToSmall(q, 0);
        _setToSmall(r, 0);
      } else {
        assert (dividend !== q && divisor !== q &&
          dividend !== r && divisor !== r);
        _uDiv(dividend, divisor, q, r);
        q.sign = dividend.sign * divisor.sign;
        _setZeroSign(q);
        r.sign = divisor.sign;
        _setZeroSign(r);
        if (dividend.sign !== divisor.sign && !isZero(r)) {
          decrement(q);
          sub2(r, divisor);
          negate(r);
        }
      }
    } else {
      throw new Error('division by zero');
    }
  }


  // -----------------------------------------------------------
  // modular exponentiation


  // compute b^e mod m into target
  // assumes unsigned!
  var modExp;
  {
    let pow = _allocate(DEFAULT_SIZE);
    let t = _allocate(DEFAULT_SIZE);
    let scratch = _allocate(DEFAULT_SIZE);
    modExp = function (b, e, m, target) {
      copy(b, pow);
      _setToSmall(target, 1);
      for (let i = 0; i < e.n-1; i++) {
        let x = e.a[i];
        for (let j = 0; j < BITS_PER_BLOCK; j++) {
          if (x & 1) {
            _uMul(target, pow, t);
            _uDiv(t, m, scratch, target);
          }
          _uMul(pow, pow, t);
          _uDiv(t, m, scratch, pow);
          x >>>= 1;
        }
      }
      let x = e.a[e.n-1];
      while (x) {
        if (x & 1) {
          _uMul(target, pow, t);
          _uDiv(t, m, scratch, target);
        }
        _uMul(pow, pow, t);
        _uDiv(t, m, scratch, pow);
        x >>>= 1;
      }
      return target;
    };
  }


  exports.make = make;

  exports.toSmall = toSmall;
  exports.toString = toString;

  exports.copy = copy;

  exports.randomize = randomize;

  exports.compare = compare;
  exports.isZero = isZero;
  exports.isOne = isOne;
  exports.isSmall = isSmall;
  exports.eqSmall = eqSmall;
  exports.eq = eq;
  exports.neq = neq;
  exports.gt = gt;
  exports.lt = lt;
  exports.gte = gte;
  exports.lte = lte;

  exports.increment = increment;
  exports.add2 = add2;
  exports.add3 = add3;

  exports.decrement = decrement;
  exports.sub2 = sub2;
  exports.sub3 = sub3;
  exports.negate = negate;

  exports.mul = mul;
  exports.mulSmall = mulSmall;

  exports.div = div;
  exports.divSmall = divSmall;

  exports.shiftLeft = shiftLeft;
  exports.shiftRight = shiftRight;

  exports.modExp = modExp;

})((typeof exports === 'undefined') ? this.x = {} : exports);
