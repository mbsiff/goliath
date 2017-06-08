(function(exports) {
  'use strict';

  // assumption is that block sizes are powers of 2

  const BLOCK_TYPED_ARRAY = Uint16Array;
  const BITS_PER_BLOCK =  8 * BLOCK_TYPED_ARRAY.BYTES_PER_ELEMENT;
  const BLOCK_MASK = BITS_PER_BLOCK - 1;

  function binLog(n) {
    let log = 0;
    while (n !== 1) {
      n = n >>> 1;
      log++;
    }
    return log;
  }
  const LOG_BLOCK_SIZE = binLog(BITS_PER_BLOCK);

  // -----------------------------------

  function blockToBitString(x) {
    let a = [];
    for(let i = 0; i < BITS_PER_BLOCK; i++) {
      a.push(x & 1);
      x = x >>> 1;
    }
    return a.join('');
  }

  function getBlockSize() {
    return BITS_PER_BLOCK;
  }

  function create(nBlocks) {
    let obj = {};
    let bitsUsed = 1;
    let blocksUsed = nBlocks;
    let a = new BLOCK_TYPED_ARRAY(nBlocks);
    obj.setBlock = function(i, value) {
      if (i < blocksUsed) {
        a[i] = value;
      } else {
        throw new RangeError('block index ' + i + ' is out of bounds');
      }
    };
    obj.getBlock = function(i) {
      if (i < blocksUsed) {
        return a[i];
      } else {
        throw new RangeError('block index ' + i + ' is out of bounds');
      }
    };
    obj.setBit = function(i, value=1) {
      const offset = i & BLOCK_MASK;
      const n = i >>> LOG_BLOCK_SIZE;
      if (n < blocksUsed) {
        if (value) {
          if (i >= bitsUsed) {
            bitsUsed = i + 1;
          }
          a[n] |= (1 << offset);
        } else {
          a[n] &= (~ (1 << offset));
        }
      } else {
        throw new RangeError('bit index ' + i + ' is out of bounds');
      }
    };
    obj.getBit = function(i) {
      const offset = i & BLOCK_MASK;
      const n = i >>> LOG_BLOCK_SIZE;
      if (n < a.length && (a[n] & (1 << offset))) {
        return 1;
      } else {
        return 0;
      }
    };
    obj.trim = function() {
      while(blocksUsed > 1 &&
        a[blocksUsed-1] === 0) {
          blocksUsed--;
        }
      };
      obj.toString = function() {
        let b = [];
        for(let i = 0; i < blocksUsed; i++) {
          b.push(blockToBitString(a[i]));
        }
        return b.join('|');
      };
      obj.getBlockSize = getBlockSize;
      obj.countBlocks = function () {
        return blocksUsed;
      };
      // what is below is not quite ready for prime time
      obj.countBits = function () {
        return bitsUsed;
      };

      return obj;
    }

    function makeBlocks(size) {
      return create(size);
    }

    function makeBits(k) {
      return makeBlocks(Math.ceil(k / BITS_PER_BLOCK));
    }

    function getBit(bitBlock, i) {
      return bitBlock.getBit(i);
    }

    function setBit(bitBlock, i, value=1) {
      return bitBlock.setBit(i, value);
    }

    function trim(bitBlock) {
      bitBlock.trim();
    }

    function toString(bitBlock) {
      return bitBlock.toString();
    }

    function countBlocks(bitBlock) {
      return bitBlock.countBlocks();
    }

    function countBits(bitBlock) {
      return bitBlock.countBits();
    }

    exports.makeBits = makeBits;
    exports.makeBlocks = makeBlocks;
    exports.countBlocks = countBlocks;
    exports.countBits = countBits;
    exports.getBlockSize = getBlockSize;
    exports.getBit = getBit;
    exports.setBit = setBit;
    exports.trim = trim;
    exports.toString = toString;

  })((typeof exports === 'undefined')
    ? this.bitBlocks = {}
    : exports);
