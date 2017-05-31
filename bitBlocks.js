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


    function makeBlocks(size) {
        return new BLOCK_TYPED_ARRAY(size);
    }

    function makeBits(k) {
        return makeBlocks(Math.ceil(k / BITS_PER_BLOCK));
    }

    function getBit(blocks, i) {
        //    const offset = i % BITS_PER_BLOCK;
        //    const n = (i - offset) / BITS_PER_BLOCK;
        // if we assume max size of array is < 2^31, we can use bit ops:
        const offset = i & BLOCK_MASK;
        const n = i >>> LOG_BLOCK_SIZE;
        if (n < blocks.length && (blocks[n] & (1 << offset))) {
            return 1;
        } else {
            return 0;
        }
    }

    function setBit(blocks, i, value=1) {
        const offset = i & BLOCK_MASK;
        const n = i >>> LOG_BLOCK_SIZE;
        if (n < blocks.length) {
            if (value) {
                blocks[n] |= (1 << offset);
            } else {
                blocks[n] &= (~ (1 << offset));
            }
        } else {
            throw new RangeError('bit index ' + i + ' is out of bounds');
        }
    }

    exports.makeBits = makeBits;
    exports.getBit = getBit;
    exports.setBit = setBit;

})((typeof exports === 'undefined') ? this.bitBlocks = {} : exports);
