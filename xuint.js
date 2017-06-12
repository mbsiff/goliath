// arbitrary precision unsigned integers
// using in-place, resizable typed arrays

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
        this.appendBlocks(1);
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


  exports.makeFromBinaryString = makeFromBinaryString;
  exports.make = make;
  exports.random = random;

})((typeof exports === 'undefined') ? this.xuint = {} : exports);
