let assert = require('assert');
let Xi = require('./xi');

const K = 100;
const REPS = 100;
const RANGE_SIZE = 30000;


// a^2 - b&2 = (a-b)*(a+b)
function testDiffSq(a, b) {
  let a2 = Xi.make();
  let b2 = Xi.make();
  let d = Xi.make();
  let s = Xi.make();
  let difference = Xi.make();
  let product = Xi.make();
  Xi.mul(a, a, a2);
  Xi.mul(b, b, b2);
  Xi.sub3(a2, b2, difference);
  Xi.sub3(a, b, d);
  Xi.add3(a, b, s);
  Xi.mul(d, s, product);
  assert.ok(Xi.eq(difference, product),
    'difference of squares fails for: ' + a + ' and ' + b);
}

let a = Xi.make();
let b = Xi.make();
for (let i = 0; i < REPS; i++) {
  Xi.randomize(a, K);
  if (Math.random() < 0.5) {
    Xi.negate(a);
  }
  Xi.randomize(b, K);
  if (Math.random() < 0.5) {
    Xi.negate(b);
  }
  testDiffSq(a, b);
}

// test division: a, b are small integers

function testDivision(smA, smB, big) {
  let smQ = Math.floor(smA / smB);
  let smR = smA % smB;
  let a = Xi.make();
  Xi.copy(big, a);
  Xi.mulSmall(a, smA);
  // 1. ....
  Xi.copy(big, b);
  Xi.mulSmall(b, smB);
  let q = Xi.make();
  let r = Xi.make();
  Xi.div(a, b, q, r);
  assert.ok(Xi.eqSmall(q, smQ),
    'division fails on quotient for: ' + a + ' / ' + b);
  assert.ok(Xi.eqSmall(r, smR),
      'division fails on remainder for: ' + a + ' % ' + b);
  // 2...
  let qCheck = Xi.make();
  Xi.copy(big, qCheck);
  Xi.mulSmall(qCheck, smQ);
  let rCheck = Xi.divSmall(a, smB, q);
  assert.ok(Xi.eq(qCheck, q),
    'division fails on quotient for: ' + a + ' / ' + smB);
  assert.ok(Xi.eqSmall(rCheck, r),
      'division fails on remainder for: ' + a + ' % ' + smB);
}

let big = Xi.make();
for (let i = 0; i < REPS; i++) {
  Xi.randomize(big, K);
  let smA = Math.floor(RANGE_SIZE * Math.random()) + 1;
  let smB = Math.floor(RANGE_SIZE * Math.random()) + 1;
  testDivision(smA, smB, big);
}


// modExp: Fermat test

function testFermat(n, expected) {
  let n1 = Xi.make();
  Xi.copy(n, n1);
  Xi.decrement(n1);
  let r = Xi.make();
  Xi.randomize(r, K);
  let z = Xi.make();
  Xi.modExp(r, n1, n, z);
  let smZ = Xi.toShort(z);
  assert.ok(expected && smZ === 1 || !expected && smZ !== 1,
    'Fermat test failed on ' + [r, n, n1, z].join(',  '));
}

// these should all pass as either they are prime or Carmichael #s
let primes = [
  '1048583',
  '1073741827',
  '1099511627791',
  '1125899906842679',
  '1152921504606847009',
  '1180591620717411303449',
  '1208925819614629174706189',
  '1237940039285380274899124357',
  '1267650600228229401496703205653'];
let carmichaels = [
  '561',
  '41041',
  '825265',
  '321197185',
  '5394826801',
  '232250619601',
  '9746347772161',
  '1436697831295441',
  '60977817398996785',
  '7156857700403137441',
  '1791562810662585767521'];

for (let s of primes) {
  let n = Xi.make(s);
  testFermat(n, true);
}
for (let s of carmichaels) {
  let n = Xi.make(s);
  testFermat(n, true);
}
let semiPrime = Xi.make();
for (let s of primes) {
  let a = Xi.make(s);
  let r = Math.floor(Math.random() * primes.length);
  let b = Xi.make(primes[r]);
  Xi.mul(a, b, semiPrime);
  testFermat(semiPrime, false);
}
