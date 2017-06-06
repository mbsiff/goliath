let Bits = require('./bitBlocks');

let bits = Bits.makeBits(100);
assert.throws(
    () => bits.setBit(101, 1),
    err => instanceof RangeError,
    'cannot set bit outside range');
