// goliath project
// testing arbitrarily large intergers

let assert = require('assert');
let Xint = require('./xint');

var n;


assert.strictEqual(Xint.ZERO.toBinaryString(), '0',
                    'constant 0 exists as expected');
assert.strictEqual(Xint.ONE.toBinaryString(), '1',
                    'constant 1 exists as expected');

n = Xint.make(37);
assert.strictEqual(n.toBinaryString(), '100101');

n = Xint.make('132057142653');
assert.strictEqual(n.toBinaryString(),
                    '1111010111111001110000001010101111101');
