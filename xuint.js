// arbitrary precision unsigned integers
// using in-place, resizable typed arrays

(function(exports){
  'use strict';

  const BITS_PER_BLOCK = 16;
  const BLOCK_MASK = BITS_PER_BLOCK - 1;
  const BASE_MASK = (1 << BITS_PER_BLOCK) - 1;
  const LOG_BLOCK_SIZE = 4;

  function make(size) {
    let obj = {};
    obj.blocks = new Uint16Array(size);
    obj.nBlocks = size;

    obj.grow = function () {
      let newSize = 2 * this.blocks.length;
      let newBlocks = new Uint16Array(newSize);
      newBlocks.set(this.blocks);
      this.blocks = newBlocks;
    };

    obj.addBlock = function() {
      this.nBlocks++;
      if (this.nBlocks >= this.blocks.length) {
        this.grow();
      }
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
        this.blocks[this.nBlocks] = 1;
        this.addBlock();
      }
    };

    // adding in place to try to save memory allocations
    // assume _this_ has enough room to add that
    // so we assume 0 <= that <= this
    // and so this grows by at most one bit?
    // this is wrong as it stands since the last carry could propagate
    // fix with some sort of inc on slice!
    obj.adduip = function (that) {
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

    obj.toString = function () {
      let s = '';
      for(let i = 0; i < this.nBlocks; i++) {
        s += blockToBitString(this.blocks[i]);
      }
      return s;
    };

    return obj;
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

  exports.makeFromBinaryString = makeFromBinaryString;
  exports.make = make;

})((typeof exports === 'undefined') ? this.xuint = {} : exports);
