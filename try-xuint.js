let X = require('./xuint');

// >>> divmod(213213123123123213, 987654321)
// (215878287, 157495086)
let a = X.makeFromDecimalString("213213123123123213");
let b = X.makeFromDecimalString("987654321");
let c = X.make(1);
let d = X.make(1);
X.dm(a, b, c, d);
console.log(X.toDecimalString(c));
console.log(X.toDecimalString(d));


// let a = X.makeFromDecimalString("213213123123123213");
// let b = X.makeFromDecimalString("987654321");
// let c = X.make(1);
// X.mult(a, b, c);
// console.log(X.toDecimalString(c));

// let k = 10000;
// console.time('random');
// let x = X.random(k);
// console.timeEnd('random');
//
// console.time('convert');
// let s = X.toDecimalString(x);
// console.timeEnd('convert');
//
// console.time('disp');
//
// console.log(s);
// console.timeEnd('disp');
//
// for (let i = 0; i < 100; i++) {
//   // console.log(X.toDecimalString(x));
//   console.time('foo');
//   f = x.findSmallFactor();
//   console.log('' + f);
//   console.timeEnd('foo');
//   x.incSlice();
// }
