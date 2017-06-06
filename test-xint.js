// goliath project
// testing arbitrarily large intergers

let assert = require('assert');
let Xint = require('./xint');

var n;

// constants
assert.strictEqual(Xint.ZERO.toBinaryString(), '0',
                    'constant 0 exists as expected');
assert.strictEqual(Xint.ONE.toBinaryString(), '1',
                    'constant 1 exists as expected');

// formation from literals
n = Xint.make(37);
assert.strictEqual(n.toString(2), '100101');

n = Xint.make('132057142653');
assert.strictEqual(n.toString(2),
                    '1111010111111001110000001010101111101');

// working with different string formats
// explicit hex string
// allowed bases
// disallowed bases throw RangeError
// invalid strings also throw RangeError


// comparisons


//
