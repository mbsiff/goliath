let X = require('./xuint');

let k = 10000;
console.time('random');
let x = X.random(k);
console.timeEnd('random');

console.time('convert');
let s = X.toDecimalString(x);
console.timeEnd('convert');

console.time('disp');

console.log(s);
console.timeEnd('disp');

for (let i = 0; i < 100; i++) {
  // console.log(X.toDecimalString(x));
  console.time('foo');
  f = x.findSmallFactor();
  console.log('' + f);
  console.timeEnd('foo');
  x.incSlice();
}
