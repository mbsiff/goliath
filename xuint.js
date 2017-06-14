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

    // resets blocks to 0 except for first block
    // use second argument to reset number of blocks
    obj.reset = function (n=0, resetBlockCount) {
      this.blocks[0] = n;
      for (let i = 1; i < this.nBlocks; i++) {
        this.blocks[i] = 0;
      }
      if (resetBlockCount) {
        this.nBlocks = 1;
      }
    };

    obj.isZero = function () {
      return this.nBlocks === 1 && this.blocks[0] === 0;
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
  function multInto(x, y, z) {
    z.extend(x.nBlocks + y.nBlocks);
    z.reset(0);
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
  function divmodInto(dividend, divisor, q, r) {
    // assume divisor not 0!
    r.reset(0, true);
    q.reset(0, true);
    for (let i = countBits(dividend); i >= 0; i--) {
      r.shiftLeft(1);
      r.setBit(0, dividend.getBit(i));
      q.shiftLeft(1);
      if (compareTo(divisor, r) <= 0) {
        console.log(toDecimalString(divisor));
        console.log(toDecimalString(r));
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

  exports.makeFromBinaryString = makeFromBinaryString;
  exports.makeFromDecimalString = makeFromDecimalString;
  exports.toDecimalString = toDecimalString;
  exports.make = make;
  exports.random = random;
  exports.mult = multInto;
  exports.dm = divmodInto;

})((typeof exports === 'undefined') ? this.xuint = {} : exports);
