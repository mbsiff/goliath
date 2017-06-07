// compare speed of xint v. js numbers

let Xint = require('./xint');

function metaTime(op, x, y, reps, name) {
  console.time(name);

  for(let i = 0; i < reps; i++) {
    op(xx, yy);
  }
  console.timeEnd(name);
}

// let BB = require('./bitBlocks');
// const BLOCK_SIZE = BB.getBlockSize();
// const CEILING = 1 << BLOCK_SIZE;
// function blockAdd(x, y) {
//   // kludge to deal with block size
//   let xbs = Math.ceil(x.countBits() / BLOCK_SIZE);
//   let ybs = Math.ceil(y.countBits() / BLOCK_SIZE);
//   let n = Math.max(xbs, ybs);
//   let z = BB.makeBits((n + 1) * BLOCK_SIZE);
//   let carry = 0;
//   for(let i = 0; i < n; i++){
//     let total = x.getBlock(i) + y.getBlock(i) + carry;
//     let sum = total % CEILING;
//     z.setBlock(i, sum);
//     carry = Math.floor(total / CEILING);
//   }
//   z.setBlock(n, carry);
//   // return _make(z);
// }


let base = 1 << 16;
let range = base * base * base;
let r0 = Math.floor(Math.random() * range + base);
let r1 = Math.floor(Math.random() * range + base);
let xx = Xint.make(r0);
let yy = Xint.make(r1);
metaTime((x, y) => x + y, r0, r1, 1000000, 'add');
metaTime(Xint.add, xx, yy, 1000000, 'addition');
metaTime(blockAdd, xx, yy, 1000000, 'block add');
