const Xi = require('./xi');
const Xl = require('./Xellip');
const assert = require('assert');

let i1 = 6;
let j1 = 730;

let P = Xl.makePoint(Xi.make(i1), Xi.make(j1));
let n = Xi.make(236);
let A = Xi.make(14);
let N = Xi.make(3623);
let R = Xl.dubAdd(P, n, A, N);
if (R.point !== Infinity){
  console.log("R = (" + R.point.x.toString() +", " + R.point.y.toString() + ")");
} else {
  console.log(R.point);
}
