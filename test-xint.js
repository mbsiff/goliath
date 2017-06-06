// goliath project
// testing arbitrarily large intergers

let assert = require('assert');
let Xint = require('./xint');

var n;


assert.strictEqual(Xint.ZERO.toBinaryString(), '0',
 'constant 0 exists as expected');
assert.strictEqual(Xint.ONE.toBinaryString(), '1');

n = Xint.make(37);
assert.
assert.strictEqual(n.toBinaryString(), '100101');
