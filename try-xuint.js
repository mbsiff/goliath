let X = require('./xuint');

// // >>> pow(987654321, 213213123123123212, 213213123123123213)
// // 189034927585406181
let m = X.make("213213123123123213");
let b = X.make("987654321");
let e = X.make('' + m);
let t = X.make(1);
// X.sub(e, t);
// X.me(b, e, m, t);
// console.log('' + t);

console.time('me');
X.randomize(b, 50);
X.randomize(e, 100);
X.randomize(m, 200);  // when this is big: subtrahend error!!!
X.me(b, e, m, t);
console.timeEnd('me');
console.log('' + b);
console.log('' + e);
console.log('' + m);
console.log('' + t);

// // >>> divmod(213213123123123213, 987654321)
// // (215878287, 157495086)
// let a = X.make("213213123123123213");
// let b = X.make("987654321");
// let c = X.make(0);
// let d = X.make(0);
// X.ud(a, b, c, d);
// console.log('' + c);
// console.log('' + d);
// console.log(c);
// console.log(d);


// let a = X.make('213213123123123213');
// let b = X.make('987654321');
// let c = X.make(0);
// X.um(a, b, c);
// console.log('' + c);
// console.log(a);
// console.log(b);
// console.log(c);

// these two numbers are 40-digit primes
// let a = X.makeFromDecimalString('2425967623052370772757633156976982469681');
// let b = X.makeFromDecimalString('5991810554633396517767024967580894321153');
// let c = X.make(1);
// X.mult(a, b, c);
// console.time('mr');
// console.log(X.mr(a));
// console.timeEnd('mr');
// console.time('mr');
// console.log(X.mr(b));
// console.timeEnd('mr');
// console.time('mr');
// console.log(X.mr(c));
// console.timeEnd('mr');
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



// >>> pow(987654321, 213213123123123212, 213213123123123213)
// 189034927585406181
// let m = X.makeFromDecimalString("213213123123123213");
// let b = X.makeFromDecimalString("987654321");
// let e = m.copy();
// e.sub(X.makeFromDecimalString("1"));
// let t = X.make(1);
// X.me(b, e, m, t);
// console.log(X.toDecimalString(t));

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
