// arbitrary precision (unsigned) integers
// using resizable typed arrays
// mutable!
// little endian

// ignores sign for now !!!

// each large integer is a sequence of 1 or more blocks
// BITS_PER_BLOCK are powers of 2
// in this case 16

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
  // sieve of Eratostheses to generate array of small primes
  function _sieve(n) {
    let primes = [2];
    let sieve = new Uint8Array(n);
    for (let i = 4; i < sieve.length; i+=2) {
      sieve[i] = 1;
    }
    let nextPrime = 3;
    while (nextPrime < sieve.length) {
      primes.push(nextPrime);
      for (let i = nextPrime*2; i < sieve.length; i += nextPrime) {
        sieve[i] = 1;
      }
      nextPrime += 2;
      while (sieve[nextPrime] && nextPrime < sieve.length) {
        nextPrime += 2;
      }
    }
    return new Uint16Array(primes);
  }
  const _PRIMES = _sieve(SHORT_LIMIT);


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

  function make(x) {
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
      multSmall(x, 10);  // !!!
      addSmall(x, digit.charCodeAt(0) - 48);   // 48 is ASCII for '0' !!!
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
      multSmall(x, 16);
      addSmall(x, parseInt(h, 16));
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
        let d = divModSmall(t, 10);
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

  function _trim(x) {
    while (x.n > 1 && x.a[x.n-1] === 0) {
      x.n--;
    }
  }

  // -----------------------------------------------------------
  var isZero = x => (x.n === 1) && (x.a[0] === 0);
  var isOne = x => (x.n === 1) && (x.a[0] === 1);


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
  // if start is specified increments starting from that bit
  function increment(x, start=0) {
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

  function addSmall(x, n) {
    let total = x.a[0] + n;
    x.a[0] = total & BASE_MASK;
    if (total >>> BITS_PER_BLOCK) {
      increment(x, 1);
    }
    return x;
  }

  // adds y into x
  function add2(x, y) {
    _resize(x, Math.max(x.n, y.n));
    let carry = 0;
    for (let i = 0; i < y.n; i++) {
      let total = x.a[i] + y.a[i] + carry;
      x.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
    }
    if (carry) {
      increment(x, y.n);
    }
    return x;
  }

  // z = x + y
  // assumes z is not x or y, though should still work
  function add3(x, y, z) {
    _resize(z, Math.max(x.n, y.n));
    let min = Math.min(x.n, y.n);
    let carry = 0;
    let i = 0;
    while (i < min) {
      let total = x.a[i] + y.a[i] + carry;
      z.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
      i++;
    }
    while (i < x.n) {
      let total = x.a[i] + carry;
      z.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
      i++;
    }
    while (i < y.n) {
      let total = y.a[i] + carry;
      z.a[i] = total & BASE_MASK;
      carry = total >>> BITS_PER_BLOCK;
      i++;
    }
    if (carry) {
      increment(z, i);
    }
    return z;
  }

  //

  // -----------------------------------------------------------
  // subtraction

  // decrement
  //subSmall
  //sub2
  //sub3



  // -----------------------------------------------------------
  // multiplication


  // multiplies x by small n into y
  // if y not specified, multiplies in place
  function multSmall(x, n, y) {
    y = y ? _resize(y, x.n) : x;
    let carry = 0;
    for (let i = 0; i < x.n; i++) {
      let total = x.a[i] * n + carry;
      y.a[i] = total & BASE_MASK;
      carry = total >> BITS_PER_BLOCK;
    }
    if (carry) {
      _appendBlock(y, carry);
    }
  }


  // -----------------------------------------------------------
  // division

  // divides x by small n
  // writes quotient into y
  // if y not specified, quotient written into x
  // assumes n > 0
  function divModSmall(x, n, y) {
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








    //
    // // subtracting in place
    // // assumes that is <= this
    // obj.sub = function (that) {
    //   let borrow = 0;
    //   for (let i = 0; i < that.nBlocks; i++) {
    //     let diff = this.blocks[i] - that.blocks[i] - borrow;
    //     if (diff < 0) {
    //       this.blocks[i] = diff + BASE;
    //       borrow = 1;
    //     } else {
    //       this.blocks[i] = diff;
    //       borrow = 0;
    //     }
    //   }
    //   if (borrow) {
    //     throw new Error('this less than that');
    //   }
    //   this.trim();
    // };
    //

    //

    //
    // obj.setBit = function(i, value=1) {
    //   const offset = i & BLOCK_MASK;
    //   const n = i >>> LOG_BLOCK_SIZE;
    //   if (n < this.nBlocks) {
    //     if (value) {
    //       this.blocks[n] |= (1 << offset);
    //     } else {
    //       this.blocks[n] &= (~ (1 << offset));
    //     }
    //   } else {
    //     throw new RangeError('bit index ' + i + ' is out of bounds');
    //   }
    // };
    //
    // obj.getBit = function(i) {
    //   const offset = i & BLOCK_MASK;
    //   const n = i >>> LOG_BLOCK_SIZE;
    //   if (n < this.nBlocks && (this.blocks[n] & (1 << offset))) {
    //     return 1;
    //   } else {
    //     return 0;
    //   }
    // };
    //
    //
    //

    //
    // // assume m is a short (block-sized) int
    // obj.modShort = function (m) {
    //   let sum = 0;
    //   for (let i = 0; i < this.nBlocks; i++) {
    //     let x = this.blocks[i];
    //     // might be able to optimize
    //     // either by memoizing this modexp calc
    //     // or even precomputing it across wide range
    //     sum = (sum + x * shortModExp(BASE, i, m)) % m;
    //   }
    //   return sum;
    // };

  //   obj.findSmallFactor = function () {
  //     for (let p of PRIMES) {
  //       if (this.modShort(p) === 0) {
  //         return p;
  //       }
  //     }
  //     return null;
  //   };
  //
  //   return obj;
  // }
  //
  //
  // function random(k) {
  //   let size = Math.ceil(k / BITS_PER_BLOCK);
  //   let x = make(size);
  //   for (let i = 0; i < k; i++) {
  //     if (Math.random() < 0.5) {
  //       x.setBit(i);
  //     }
  //   }
  //   x.trim();
  //   return x;
  // }
  //






  //
  // function shortModExp(b, e, m) {
  //   let y = 1;
  //   let pow = b;
  //   while (e) {
  //     if (e & 1) {
  //       y = (y * pow) % m;
  //     }
  //     pow = (pow * pow) % m;
  //     e >>>= 1;
  //   }
  //   return y;
  // }
  //
  //
  //


  // z = x * y
  // assumes z allocated...
  // function mult(x, y, z) {
  //   z.extend(x.nBlocks + y.nBlocks);
  //   reset(z, 0);
  //   let carry = 0;
  //   let k = 0;
  //   for (let i = 0; i < y.nBlocks; i++){
  //     k = i;
  //     carry = 0;
  //     let b = y.blocks[i];
  //     if (b) {
  //       for (let j = 0; j < x.nBlocks; j++) {
  //         let t = x.blocks[j] * b + z.blocks[k] + carry;
  //         z.blocks[k] = t & BASE_MASK;
  //         carry = t >>> BITS_PER_BLOCK;
  //         k++;
  //       }
  //       z.blocks[k] = carry;
  //     }
  //   }
  //   z.trim();
  //   return z;
  // }


  // function countBits(x) {
  //   let bits = ((x.nBlocks - 1) * BITS_PER_BLOCK) + 1;
  //   let y = x.blocks[x.nBlocks - 1];
  //   while (y >= 2) {
  //     bits++;
  //     y >>>= 1;
  //   }
  //   return bits;
  // }

  // this does not use blocks...
  // remains to be seen if overhead of that approach would be worth it
  // function divmod(dividend, divisor, q, r) {
  //   // assume divisor not 0!
  //   reset(r, 0, true);
  //   reset(q, 0, true);
  //   for (let i = countBits(dividend); i >= 0; i--) {
  //     r.shiftLeft(1);
  //     r.setBit(0, dividend.getBit(i));
  //     q.shiftLeft(1);
  //     if (compareTo(divisor, r) <= 0) {
  //       r.sub(divisor);
  //       q.setBit(0);
  //     }
  //   }
  // }
  //
  // function compareTo(x, y) {
  //   let n = x.nBlocks;
  //   let d = n - y.nBlocks;
  //   for (let i = n - 1; d === 0 && i >= 0; i--) {
  //     d = x.blocks[i] - y.blocks[i];
  //   }
  //   return Math.sign(d);
  // }



  // this is a very crude object pool
  // idea is to allocate temporary xuints only if
  // none are available
  // requires functions that use them to be very careful
  // to return (unget) and _not_ reuse local pointers
  // to those objects after ungetting
  // let objPool = {
  //   stack: [],
  //   get: function() {
  //     if (this.stack.length > 0) {
  //       return this.stack.pop();
  //     } else {
  //       return make(1000);  // !!!
  //     }
  //   },
  //   unget: function (x) {
  //     this.stack.push(x);
  //     return null;
  //   }
  // };



  // function modExp(b, e, m, target) {
  //   let t = objPool.get();
  //   let scratch = objPool.get();
  //   let pow = b.copy();
  //   reset(target, 1);
  //   for (let i = 0; i < e.nBlocks-1; i++) {
  //     let x = e.blocks[i];
  //     for (let j = 0; j < BITS_PER_BLOCK; j++) {
  //       if (x & 1) {
  //         mult(target, pow, t);
  //         divmod(t, m, scratch, target);
  //       }
  //       mult(pow, pow, t);
  //       divmod(t, m, scratch, pow);
  //       x >>>= 1;
  //     }
  //   }
  //   let x = e.blocks[e.nBlocks-1];
  //   while (x) {
  //     if (x & 1) {
  //       mult(target, pow, t);
  //       divmod(t, m, scratch, target);
  //     }
  //     mult(pow, pow, t);
  //     divmod(t, m, scratch, pow);
  //     x >>>= 1;
  //   }
  //   t = objPool.unget(t);
  //   scratch = objPool.unget(scratch);
  //   return target;
  // }
  //
  //
  // // function reallocate(x, newSize) {
  // //   let newBlocks = new Uint16Array(newSize);
  // //   newBlocks.set(x.blocks.subarray(0, x.nBlocks));
  // //   x.blocks = newBlocks;
  // //   return x;
  // // }
  //
  // // guarantees that x is allocated to be at least newSize blocks
  // // and sets x's size to be newSize
  // // returns x
  // // function resize(x, newSize) {
  // //   x.nBlocks = newSize;
  // //   if (newSize > x.blocks.length) {
  // //     reallocate(x, newSize);
  // //   }
  // //   return x;
  // // }
  //
  // // copies src to dst, returns dst
  // // function copy(src, dst) {
  // //   if (src.nBlocks > dst.blocks.length) {
  // //     dst.blocks = new Uint16Array(src.blocks);
  // //   } else {
  // //     dst.blocks.set(src.blocks.subarray(0, src.nBlocks));
  // //   }
  // //   dst.nBlocks = src.nBlocks;
  // //   return dst;
  // // }
  //
  // function getBit(x, i) {
  //   const offset = i & BLOCK_MASK;
  //   const n = i >>> LOG_BLOCK_SIZE;
  //   if (n < x.nBlocks && (x.blocks[n] & (1 << offset))) {
  //     return 1;
  //   } else {
  //     return 0;
  //   }
  // }
  //
  // // decrement, assumes x > 0
  // function decrement(x, start = 0) {
  //   let borrow = 1;
  //   let b = 0;
  //   for (let i = start; borrow && i < x.nBlocks; i++) {
  //     b = x.blocks[i];
  //     if (b) {
  //       x.blocks[i] = b - 1;
  //       borrow = 0;
  //     } else {
  //       x.blocks[i] = BASE - 1;
  //       borrow = 1;
  //     }
  //   }
  //   if (borrow) {
  //     throw new Error('cannot decrement 0');
  //   }
  //   if (x.nBlocks > 1 && b === 1) {
  //     x.nBlocks--;
  //   }
  //   return x;
  // }
  //
  //

  //
  // // resets blocks to 0 except for first block
  // // uses third argument to reset number of blocks
  // // is that third arg needed?
  // function reset(x, n=0, resetBlockCount) {
  //   x.blocks[0] = n;
  //   if (resetBlockCount) {
  //     x.nBlocks = 1;
  //   } else {
  //     x.blocks.fill(0, 1, x.nBlocks);
  //   }
  // }
  //

  //
  //
  // // uses Miller-Rabin test. iters is the number of repetitions; if it
  // //     returns True then n is prime with probability at least 1/2^iters;
  // //     if False; then n is definitely composite.
  // // assumes n > 2
  // function millerRabin(n, iters=4) {
  //   if (getBit(n, 0) === 0) {
  //     return false;
  //   }
  //   let n1 = objPool.get();
  //   let d = objPool.get();
  //   let base = objPool.get();
  //   let pow = objPool.get();
  //   let exp = objPool.get();
  //   let t = objPool.get();
  //   let scratch = objPool.get();
  //   copy(n, n1);
  //   decrement(n1);
  //   copy(n1, d);
  //   while (getBit(d, 0) === 0) {
  //     shiftRight(d, 1);
  //   }
  //   let couldBePrime = true;
  //   for (let i = 0; couldBePrime && i < iters; i++) {
  //     let rp = PRIMES[Math.floor(Math.random() * PRIMES.length)];
  //     reset(base, rp, true);
  //     copy(d, exp);
  //     modExp(base, exp, n, pow);
  //     // might be possible to squeeze a little more out of this...
  //     while (!isOne(pow) && compareTo(pow, n1) && compareTo(exp, n1)) {
  //       mult(pow, pow, t);
  //       divmod(t, n, scratch, pow);
  //       //shiftLeft(exp, 1);
  //       exp.shiftLeft(1);
  //     }
  //     couldBePrime = getBit(exp, 0) === 1 || compareTo(pow, n1) === 0;
  //   }
  //   scratch = objPool.get(scratch);
  //   t = objPool.unget(t);
  //   exp = objPool.get(exp);
  //   pow = objPool.get(pow);
  //   base = objPool.get(base);
  //   d = objPool.unget(d);
  //   n1 = objPool.unget(n1);
  //   return couldBePrime;
  // }


  exports.make = make;
  exports.add2 = add2;
  exports.add3 = add3;
  // exports.copy = copy;


})((typeof exports === 'undefined') ? this.xuint = {} : exports);
