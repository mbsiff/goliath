// goliath project
// testing arbitrarily large intergers

let assert = require('assert');
let Xint = require('./xint');


var m, n, z;


// constants
assert.strictEqual(Xint.ZERO.toBinaryString(), '0',
                    'constant 0 exists as expected');
assert.strictEqual(Xint.ONE.toBinaryString(), '1',
                    'constant 1 exists as expected');

// formation from literals
n = Xint.make(37);
assert.strictEqual(n.toBinaryString(), '100101');

n = Xint.make('132057142653');
assert.strictEqual(n.toBinaryString(),
                    '1111010111111001110000001010101111101');

// working with different string formats

// comparisons



// addition
n = Xint.make('132057142653');
m = Xint.make('999999999999');
z = Xint.make('1132057142652');
assert.strictEqual(Xint.compareTo(Xint.add(n, m), z),
                    0);
