// compare speed of xint v. js numbers

let Xint = require('./xint');

// function metaTime(op, x, y, name, reps=1000000) {
//   console.time(name);
//
//   for(let i = 0; i < reps; i++) {
//     let z = op(x, y);
//   }
//   console.timeEnd(name);
// }

// const LIMIT = 65536;
// let r0 = Math.floor(Math.random() * LIMIT);
// let r1 = Math.floor(Math.random() * LIMIT);
// let xx = Xint.make(r0);
// let yy = Xint.make(r1);
// console.log('testing on ' + r0 + ', ' + r1);
// metaTime((x, y) => x + y, r0, r1, 'built-in +');
// metaTime(Xint.add, xx, yy, 'xint add');
// metaTime(Xint.blockAdd, xx, yy, 'block add');
// metaTime((x, y) => x * y, r0, r1, 'built-in *');
// metaTime(Xint.mult, xx, yy, 'xint mult');
// metaTime(Xint.blockMult, xx, yy, 'block mult');

function timerAdd(bitSize, repetitions, sampleSize){
  let tbit = tblock = 0;
  for (let j = 0; j < sampleSize; j++){
    let timeBit = timeBlock = 0;
    let x = Xint.rand(bitSize);
    let y = Xint.rand(bitSize);
    let t0 = Date.now();

    for(let i = 0; i < repetitions; i++){
      let z = Xint.add(x, y);
    }
    timeBit += (Date.now() - t0);
    t0 = Date.now();

    for(let i = 0; i < repetitions; i++){
      j = i
      let z = Xint.blockAdd(x, y);
    }
    timeBlock += (Date.now() - t0);

    tbit += timeBit / repetitions;
    tblock += timeBlock / repetitions;
  }
  console.log(bitSize, tbit/sampleSize, tblock/sampleSize);
}


function timerMult(bitSize, repetitions, sampleSize){
  let tbit = tblock = 0;
  for (let j = 0; j < sampleSize; j++){
    let timeBit = timeBlock = 0;
    let x = Xint.rand(bitSize);
    let y = Xint.rand(bitSize);
    let t0 = Date.now();

    for(let i = 0; i < repetitions; i++){
      let z = Xint.mult(x, y);
    }
    timeBit += (Date.now() - t0);
    t0 = Date.now();

    for(let i = 0; i < repetitions; i++){
      let z = Xint.blockMult(x, y);
    }
    timeBlock += (Date.now() - t0);

    tbit += timeBit / repetitions;
    tblock += timeBlock / repetitions;
  }
  console.log(bitSize, tbit/sampleSize, tblock/sampleSize);
}

function timerModex(bitSize, repetitions, sampleSize){
  let tbit = tblock = 0;
  for (let j = 0; j < sampleSize; j++){
    let timeBit = timeBlock = 0;
    let x = Xint.rand(bitSize);
    let y = Xint.rand(bitSize);
    let z = Xint.rand(bitSize);
    let t0 = Date.now();
    for(let i = 0; i < repetitions; i++){
      let a = Xint.modex(x, y, z);
    }
    timeBlock += (Date.now() - t0);
    tblock += timeBlock / repetitions;
  }
  console.log(bitSize, tblock/sampleSize);
}

for (let i = 1000; i< 3000; i = i + 200){
  timerModex(i, 20, 20);
}
