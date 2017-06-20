let assert = require('assert');
let Xi = require('./xi');

const K = 100;
const REPS = 100;
const RANGE_SIZE = 15000;


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
  let b = Xi.make();
  Xi.copy(big, b);
  Xi.mulSmall(b, smB);
  // 1. if    smA = smB * smQ + smR
  //    then  BIG*smA = BIG*smB*smQ + BIG*smR
  let q = Xi.make();
  let r = Xi.make();
  Xi.div(a, b, q, r);
  assert.ok(Xi.eqSmall(q, smQ),
    'division fails on quotient for: ' +
      [smA, smB, smQ, smR, big, a, b, q, r].join('\n'));

  let rCheck = Xi.make();
  Xi.copy(big, rCheck);
  Xi.mulSmall(rCheck, smR);
  assert.ok(Xi.eq(r, rCheck),
     'division fails on remainder for: ' +
     [smA, smB, smQ, smR, big, a, b, q, r].join('\n'));
  // 2. BIG*smA % smB = (BIG%smB * smA%smB) % smB
  //          a % smB = ((BIG%smB) * smR) % smB
  let t = Xi.make();
  let r0 = Xi.divSmall(a, smB, t);
  let r1 = Xi.divSmall(big, smB, t);
  let r2 = (r1 * smR) % smB;
  assert.ok(r0 === r2,
    'divSmall remainder fail on ' +
    [smA, smB, smQ, smR, big, a, b, r0, r1, r2].join('\n'));
}

let big = Xi.make();
for (let i = 0; i < REPS; i++) {
  Xi.randomize(big, K);
  let smA = Math.floor(RANGE_SIZE * Math.random()) + 1001;
  let smB = Math.floor(RANGE_SIZE * Math.random()) + 1;
  testDivision(smA, smB, big);
}


// signed division: tests that if divmod(a,b)=(q,r)
// then a = qb + r
function testDivMul(a, b) {
  let q = Xi.make();
  let r = Xi.make();
  let t = Xi.make();
  Xi.div(a, b, q, r);
  Xi.mul(b, q, t);
  Xi.add2(t, r);
  // console.log(a, t);
  // console.log('trying a = bq + r on:\n' + [a, b, q, r, t].join('\n'));
  assert.ok(Xi.eq(a, t),
    'a = bq + r fails for\n' + [a, b, q, r, t].join('\n'));
}

for (let i = 0; i < REPS; i++) {
  Xi.randomize(a, K);
  testDivMul(a, b);
  Xi.negate(a);
  testDivMul(a, b);
  Xi.negate(b);
  testDivMul(a, b);
  Xi.negate(a);
  testDivMul(a, b);
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
  let smZ = Xi.toSmall(z);
  // console.log('Fermat testing ' + [r, n, n1, z].join(',  '));
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
// Carmichael test won't work as is
// because random base might not be relatively prime to Carmichael #
// for (let s of carmichaels) {
//   let n = Xi.make(s);
//   testFermat(n, true);
// }
let semiPrime = Xi.make();
for (let s of primes) {
  let a = Xi.make(s);
  let r = Math.floor(Math.random() * primes.length);
  let b = Xi.make(primes[r]);
  Xi.mul(a, b, semiPrime);
  testFermat(semiPrime, false);
}
