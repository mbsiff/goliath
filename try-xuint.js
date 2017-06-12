let X = require('./xuint');

let a = X.makeFromBinaryString('11101110111011100001000100010001');
for (let i = 0; i < 30; i++) {
  a.shiftLeft(3);
  console.log(a.toString(16));
}
