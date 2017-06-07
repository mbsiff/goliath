// goliath project
// testing arbitrarily large intergers

let assert = require('assert');
let Xint = require('./xint');

var m, n, s, x, z;

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

// negative numbers ...

// working with different string formats ...

// comparisons ...


// addition
n = Xint.make('132057142653');
m = Xint.make('999999999999');
z = Xint.make('1132057142652');
assert.strictEqual(Xint.compareTo(Xint.add(n, m), z),
                    0);

// subtraction
n = Xint.make('132057142653');
m = Xint.make('999999999999');
z = Xint.make('1132057142652');
assert.strictEqual(Xint.compareTo(Xint.sub(z, m), n),
                    0);

// multiplication
n = Xint.make('132057142653');
m = Xint.make('999999999999');
z = Xint.make('132057142652867942857347');
assert.strictEqual(Xint.compareTo(Xint.mult(n, m), z),
                    0);

// division and remainder
n = Xint.make('132057142653');
m = Xint.make('999999999999');
z = Xint.make('75600001428');
x = Xint.divmod(m, n);
assert.strictEqual(Xint.compareTo(x.q, Xint.make(7)), 0);
assert.strictEqual(Xint.compareTo(x.r, z), 0);

// representation as decimal string
s = '132057142653';
n = Xint.make(s);
assert.strictEqual(s, n.toString(), 0);
