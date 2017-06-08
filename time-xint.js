// compare speed of xint v. js numbers

let Xint = require('./xint');

function metaTime(op, x, y, name, reps=1000000) {
  console.time(name);

  for(let i = 0; i < reps; i++) {
    let z = op(x, y);
  }
  console.timeEnd(name);
}


const LIMIT = 65536;
let r0 = Math.floor(Math.random() * LIMIT);
let r1 = Math.floor(Math.random() * LIMIT);
let xx = Xint.make(r0);
let yy = Xint.make(r1);
console.log('testing on ' + r0 + ', ' + r1);
metaTime((x, y) => x + y, r0, r1, 'built-in +');
metaTime(Xint.add, xx, yy, 'xint add');
// metaTime(Xint.blockAdd, xx, yy, 1000000, 'block add');
//metaTime((x, y) => x * y, r0, r1, 100000, 'built-in *');
//metaTime(Xint.mult, xx, yy, 100000, 'xint mult');
// metaTime... blockMult
