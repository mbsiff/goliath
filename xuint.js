// arbitrary precision unsigned integers
// using in-place, resizable typed arrays

// usually using functions rather than methods
// three-argument where _first_ is destination
// and comments indicate if destrination can match others...
// can we use assert on that??? do we care ????

(function(exports){
  'use strict';

  const BITS_PER_BLOCK = 16;
  const BLOCK_MASK = BITS_PER_BLOCK - 1;
  const BASE_MASK = (1 << BITS_PER_BLOCK) - 1;
  const LOG_BLOCK_SIZE = 4;

  const SHORT_LIMIT = 1 << BITS_PER_BLOCK;
  const BASE = SHORT_LIMIT;

  let sieve = new Uint8Array(SHORT_LIMIT);

  for (let i = 4; i < sieve.length; i+=2) {
    sieve[i] = 1;
  }
  let nextPrime = 3;
  let primes = [2];
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

  const PRIMES = new Uint16Array(primes);


  function make(size) {
    let obj = {};
    obj.blocks = new Uint16Array(size);
    obj.nBlocks = size;

    obj.copy = function () {
      let cpy = make(this.nBlocks);
      cpy.blocks.set(this.blocks.subarray(0, this.nBlocks));
      return cpy;
    };

    obj.extend = function (newSize) {
      this.nBlocks = newSize;
      if (newSize > this.blocks.length) {
        this.grow(newSize);
      }
    };

    obj.grow = function (newSize) {
      let newBlocks = new Uint16Array(newSize);
      newBlocks.set(this.blocks);
      this.blocks = newBlocks;
    };

    obj.trim = function () {
      while (this.nBlocks > 1 && this.blocks[this.nBlocks-1] === 0) {
        this.nBlocks--;
      }
    };

    obj.appendBlock = function(x) {
      if (this.nBlocks >= this.blocks.length) {
        this.grow(2 * this.blocks.length);
      }
      this.blocks[this.nBlocks] = x;
      this.nBlocks++;
    };



    // ??? this might be buggy still if start not 0?
    // increment (slice to end) in place
    // assumes this' block array has one more block to spare
    obj.incSlice = function (start=0) {
      let carry = 1;
      for (let i=start; carry && i < this.nBlocks; i++) {
        let total = this.blocks[i] + 1;
        this.blocks[i] = total & BASE_MASK;
        carry = total >>> BITS_PER_BLOCK;
      }
      if (carry) {
        this.appendBlock(1);
      }
    };

    // adding in place
    obj.adduip = function (that) {
      this.extend(1 + Math.max(this.nBlocks, that.nBlocks));
      let carry = 0;
      for (let i = 0; i < that.nBlocks; i++) {
        let total = this.blocks[i] + that.blocks[i] + carry;
        this.blocks[i] = total & BASE_MASK;
        carry = total >> BITS_PER_BLOCK;
      }
      if (carry) {
        this.incSlice(that.nBlocks);
      }
    };

    // adds by short n, in place
    obj.addShort = function (n) {
      let total = this.blocks[0] + n;
      this.blocks[0] = total & BASE_MASK;
      if (total >>> BITS_PER_BLOCK) {
        this.incSlice(1);
      }
    };

    // subtracting in place
    // assumes that is <= this
    obj.sub = function (that) {
      let borrow = 0;
      for (let i = 0; i < that.nBlocks; i++) {
        let diff = this.blocks[i] - that.blocks[i] - borrow;
        if (diff < 0) {
          this.blocks[i] = diff + BASE;
          borrow = 1;
        } else {
          this.blocks[i] = diff;
          borrow = 0;
        }
      }
      if (borrow) {
        throw new Error('this less than that');
      }
      this.trim();
    };

    // multiplies by short n, in place
    obj.multShort = function (n) {
      let carry = 0;
      for (let i = 0; i < this.nBlocks; i++) {
        let total = this.blocks[i] * n + carry;
        this.blocks[i] = total & BASE_MASK;
        carry = total >> BITS_PER_BLOCK;
      }
      if (carry) {
        this.appendBlock(carry);
      }
    };

    // dividing by single block (short) integer
    // writes quotient into target (assumed allocated)
    // returns remainder since quotient written into target
    // should allow for target to be itself (this)
    obj.divShort = function(n, target) {
      let rem = 0;
      for (let i = this.nBlocks - 1; i >=0; i--) {
        let high = rem;
        let low = this.blocks[i];
        let v = high * (1 << BITS_PER_BLOCK) + low;
        let q = Math.floor(v / n);
        target.blocks[i] = q;
        rem = v - (q * n);
      }
      target.trim();
      return rem;
    };

    obj.setBit = function(i, value=1) {
      const offset = i & BLOCK_MASK;
      const n = i >>> LOG_BLOCK_SIZE;
      if (n < this.nBlocks) {
        if (value) {
          this.blocks[n] |= (1 << offset);
        } else {
          this.blocks[n] &= (~ (1 << offset));
        }
      } else {
        throw new RangeError('bit index ' + i + ' is out of bounds');
      }
    };

    obj.getBit = function(i) {
      const offset = i & BLOCK_MASK;
      const n = i >>> LOG_BLOCK_SIZE;
      if (n < this.nBlocks && (this.blocks[n] & (1 << offset))) {
        return 1;
      } else {
        return 0;
      }
    };

    obj.toString = function (radix=2) {
      let s = '';
      const MAPS = { 2: blockToBitString, 16: blockToHexString };
      for(let i = 0; i < this.nBlocks; i++) {
        s = MAPS[radix](this.blocks[i]) + s;
      }
      if (s.length > 1) {
        return s.replace(/^0*/, '');
      } else {
        return s;
      }
    };

    obj.shiftLeft = function (k) {
      let kMask = (1 << k) - 1;
      let kBar = BITS_PER_BLOCK - k;
      let lopped = 0;
      for (let i = 0; i < this.nBlocks; i++) {
        let x = this.blocks[i];
        let t = (x >>> kBar) & kMask;
        this.blocks[i] = (x << k) | lopped;
        lopped = t;
      }
      if (lopped) {
        this.appendBlock(lopped);

      }
    };

    // assume m is a short (block-sized) int
    obj.modShort = function (m) {
      let sum = 0;
      for (let i = 0; i < this.nBlocks; i++) {
        let x = this.blocks[i];
        // might be able to optimize
        // either by memoizing this modexp calc
        // or even precomputing it across wide range
        sum = (sum + x * shortModExp(BASE, i, m)) % m;
      }
      return sum;
    };

    obj.findSmallFactor = function () {
      for (let p of PRIMES) {
        if (this.modShort(p) === 0) {
          return p;
        }
      }
      return null;
    };

    return obj;
  }


  function random(k) {
    let size = Math.ceil(k / BITS_PER_BLOCK);
    let x = make(size);
    for (let i = 0; i < k; i++) {
      if (Math.random() < 0.5) {
        x.setBit(i);
      }
    }
    x.trim();
    return x;
  }


  // assumes bitString well-formed
  function makeFromBinaryString(bitString) {
    let n = bitString.length;
    let size = Math.ceil(n / BITS_PER_BLOCK);
    let x = make(size);
    let j = n - 1;
    for (let i = 0; i < n; i++) {
      if (bitString.charAt(j) === '1') {
        x.setBit(i);
      }
      j--;
    }
    return x;
  }

  // assumes digits well-formed
  function makeFromDecimalString(digits) {
    let x = make(1);
    for (let digit of digits) {
      x.multShort(10);
      x.addShort(digit.charCodeAt(0) - 48);
    }
    return x;
  }

  function blockToBitString(x) {
    let s = '';
    for(let i = 0; i < BITS_PER_BLOCK; i++) {
      s = (x & 1) + s;
      x = x >>> 1;
    }
    return s;
  }

  function blockToHexString(x) {
    let s = '';
    for (let i = 0; i < BITS_PER_BLOCK; i+=4) {
      s = (x & 0xF).toString(16) + s;
      x = x >>> 4;
    }
    return s;
  }

  function shortModExp(b, e, m) {
    let y = 1;
    let pow = b;
    while (e) {
      if (e & 1) {
        y = (y * pow) % m;
      }
      pow = (pow * pow) % m;
      e >>>= 1;
    }
    return y;
  }


  function toDecimalString(x) {
    if (x.isZero()) {
      return '0';
    }
    let t = x.copy();
    let s = '';
    while (!t.isZero()) {
      let d = t.divShort(10, t);
      s = d + s;
    }
    return s;
  }


  // z = x * y
  // assumes z allocated...
  function mult(x, y, z) {
    z.extend(x.nBlocks + y.nBlocks);
    reset(z, 0);
    let carry = 0;
    let k = 0;
    for (let i = 0; i < y.nBlocks; i++){
      k = i;
      carry = 0;
      let b = y.blocks[i];
      if (b) {
        for (let j = 0; j < x.nBlocks; j++) {
          let t = x.blocks[j] * b + z.blocks[k] + carry;
          z.blocks[k] = t & BASE_MASK;
          carry = t >>> BITS_PER_BLOCK;
          k++;
        }
        z.blocks[k] = carry;
      }
    }
    z.trim();
    return z;
  }


  function countBits(x) {
    let bits = ((x.nBlocks - 1) * BITS_PER_BLOCK) + 1;
    let y = x.blocks[x.nBlocks - 1];
    while (y >= 2) {
      bits++;
      y >>>= 1;
    }
    return bits;
  }

  // this does not use blocks...
  // remains to be seen if overhead of that approach would be worth it
  function divmod(dividend, divisor, q, r) {
    // assume divisor not 0!
    reset(r, 0, true);
    reset(q, 0, true);
    for (let i = countBits(dividend); i >= 0; i--) {
      r.shiftLeft(1);
      r.setBit(0, dividend.getBit(i));
      q.shiftLeft(1);
      if (compareTo(divisor, r) <= 0) {
        r.sub(divisor);
        q.setBit(0);
      }
    }
  }

  function compareTo(x, y) {
    let n = x.nBlocks;
    let d = n - y.nBlocks;
    for (let i = n - 1; d === 0 && i >= 0; i--) {
      d = x.blocks[i] - y.blocks[i];
    }
    return Math.sign(d);
  }



  // this is a very crude object pool
  // idea is to allocate temporary xuints only if
  // none are available
  // requires functions that use them to be very careful
  // to return (unget) and _not_ reuse local pointers
  // to those objects after ungetting
  let objPool = {
    stack: [],
    get: function() {
      if (this.stack.length > 0) {
        return this.stack.pop();
      } else {
        return make(1000);  // !!!
      }
    },
    unget: function (x) {
      this.stack.push(x);
      return null;
    }
  };



  function modExp(b, e, m, target) {
    let t = objPool.get();
    let scratch = objPool.get();
    let pow = b.copy();
    reset(target, 1);
    for (let i = 0; i < e.nBlocks-1; i++) {
      let x = e.blocks[i];
      for (let j = 0; j < BITS_PER_BLOCK; j++) {
        if (x & 1) {
          mult(target, pow, t);
          divmod(t, m, scratch, target);
        }
        mult(pow, pow, t);
        divmod(t, m, scratch, pow);
        x >>>= 1;
      }
    }
    let x = e.blocks[e.nBlocks-1];
    while (x) {
      if (x & 1) {
        mult(target, pow, t);
        divmod(t, m, scratch, target);
      }
      mult(pow, pow, t);
      divmod(t, m, scratch, pow);
      x >>>= 1;
    }
    t = objPool.unget(t);
    scratch = objPool.unget(scratch);
    return target;
  }


  // function reallocate(x, newSize) {
  //   let newBlocks = new Uint16Array(newSize);
  //   newBlocks.set(x.blocks.subarray(0, x.nBlocks));
  //   x.blocks = newBlocks;
  //   return x;
  // }

  // guarantees that x is allocated to be at least newSize blocks
  // and sets x's size to be newSize
  // returns x
  // function resize(x, newSize) {
  //   x.nBlocks = newSize;
  //   if (newSize > x.blocks.length) {
  //     reallocate(x, newSize);
  //   }
  //   return x;
  // }

  // copies src to dst, returns dst
  function copy(src, dst) {
    if (src.nBlocks > dst.blocks.length) {
      dst.blocks = new Uint16Array(src.blocks);
    } else {
      dst.blocks.set(src.blocks.subarray(0, src.nBlocks));
    }
    dst.nBlocks = src.nBlocks;
    return dst;
  }

  function getBit(x, i) {
    const offset = i & BLOCK_MASK;
    const n = i >>> LOG_BLOCK_SIZE;
    if (n < x.nBlocks && (x.blocks[n] & (1 << offset))) {
      return 1;
    } else {
      return 0;
    }
  }

  // decrement, assumes x > 0
  function decrement(x, start = 0) {
    let borrow = 1;
    let b = 0;
    for (let i = start; borrow && i < x.nBlocks; i++) {
      b = x.blocks[i];
      if (b) {
        x.blocks[i] = b - 1;
        borrow = 0;
      } else {
        x.blocks[i] = BASE - 1;
        borrow = 1;
      }
    }
    if (borrow) {
      throw new Error('cannot decrement 0');
    }
    if (x.nBlocks > 1 && b === 1) {
      x.nBlocks--;
    }
    return x;
  }


  function shiftRight(x, k = 1) {
    let kBar = BITS_PER_BLOCK - k;
    let lopped = 0;
    for (let i = x.nBlocks - 1;  i >= 0; i--) {
      let b = x.blocks[i];
      x.blocks[i] = (b >>> k) | lopped;
      lopped = b << kBar;
    }
    if (x.nBlocks > 1 && x.blocks[x.nBlocks - 1] === 0) {
      x.nBlocks--;
    }
    return x;
  }

  // resets blocks to 0 except for first block
  // uses third argument to reset number of blocks
  // is that third arg needed?
  function reset(x, n=0, resetBlockCount) {
    x.blocks[0] = n;
    if (resetBlockCount) {
      x.nBlocks = 1;
    } else {
      x.blocks.fill(0, 1, x.nBlocks);
    }
  }

  // function isZero(x) {
  //   return (x.nBlocks === 1 && x.blocks[0] === 0);
  // }

  function isOne(x) {
    return (x.nBlocks === 1 && x.blocks[0] === 1);
  }


  // uses Miller-Rabin test. iters is the number of repetitions; if it
  //     returns True then n is prime with probability at least 1/2^iters;
  //     if False; then n is definitely composite.
  // assumes n > 2
  function millerRabin(n, iters=4) {
    if (getBit(n, 0) === 0) {
      return false;
    }
    let n1 = objPool.get();
    let d = objPool.get();
    let base = objPool.get();
    let pow = objPool.get();
    let exp = objPool.get();
    let t = objPool.get();
    let scratch = objPool.get();
    copy(n, n1);
    decrement(n1);
    copy(n1, d);
    while (getBit(d, 0) === 0) {
      shiftRight(d, 1);
    }
    let couldBePrime = true;
    for (let i = 0; couldBePrime && i < iters; i++) {
      let rp = PRIMES[Math.floor(Math.random() * PRIMES.length)];
      reset(base, rp, true);
      copy(d, exp);
      modExp(base, exp, n, pow);
      // might be possible to squeeze a little more out of this...
      while (!isOne(pow) && compareTo(pow, n1) && compareTo(exp, n1)) {
        mult(pow, pow, t);
        divmod(t, n, scratch, pow);
        //shiftLeft(exp, 1);
        exp.shiftLeft(1);
      }
      couldBePrime = getBit(exp, 0) === 1 || compareTo(pow, n1) === 0;
    }
    scratch = objPool.get(scratch);
    t = objPool.unget(t);
    exp = objPool.get(exp);
    pow = objPool.get(pow);
    base = objPool.get(base);
    d = objPool.unget(d);
    n1 = objPool.unget(n1);
    return couldBePrime;
  }


  exports.makeFromBinaryString = makeFromBinaryString;
  exports.makeFromDecimalString = makeFromDecimalString;
  exports.toDecimalString = toDecimalString;
  exports.make = make;
  exports.random = random;
  exports.mult = mult;
  exports.dm = divmod;
  exports.me = modExp;
  exports.mr = millerRabin;

})((typeof exports === 'undefined') ? this.xuint = {} : exports);
