const Xi = require('./xi');
const Xl = require('./Xellip');
const assert = require('assert');

//takes two points P, Q a curve paramter A, and a modulus N, and obtains the
//point P + Q = R;
//assumes all paramters are Xi numbers;
function modAdd(P, Q, A, N){
  let x1 = P.point.x;
  let y1 = P.point.y;
  let x2 = Q.point.x;
  let y2 = Q.point.y;
  let x3 = Xi.make();
  let y3 = Xi.make();
  let lambda = Xi.make();
  let d = Xl.distinct(P, Q, N);
  let t0 = Xi.make();
  let t1 = Xi.make();
  let t2 = Xi.make();
  if (d === -1 || d === 2){
      return Xl.O;
  } else if (d === 0){
      Xi.mul(x1, x1, t0);     // t0 = x1^2;
      Xi.mulSmall(t0, 3, t1)  // t1 = 3(x1^2); t0 now free;
      Xi.add3(t1, A, t0);     // t0 = 3(x1^2) + A; t1 now free;
      Xi.mulSmall(y1, 2, t1); // t1 = 2y1;
      inv = Xl.extended(t1, N).inverse; // inv = (2y1)^-1; t1 now free;
      Xi.mul(t0, inv, t1);    // t1 = (3(x1^2) + A) * (2y1)^-1; t0 now free;
      Xi.div(t1, N, t0, t2);  // t2 = ((3(x1^2) + A) * (2y1)^-1) % N;
      lambda = t2;            // all variables freed;
  } else {
      Xi.sub3(y2, y1, t0);    // t0 = y2 - y1;
      Xi.sub3(x2, x1, t1);    // t1 = x2 - x1;
      inv = Xl.extended(t1, N).inverse; // inv = (x2 - x1)^-1; t1 now free;
      Xi.mul(t0, inv, t1);    // t1 = (y2 - y1)*((x2 - x1)^-1); t0 now free;
      Xi.div(t1, N, t0, t2);  // t2 = (y2 - y1)*((x2 - x1)^-1) % N;
      lambda = t2;            // all variables freed;
  }
  Xi.mul(lambda, lambda, t0); // t0 = lambda^2;
  Xi.sub3(t0, x1, t1);        // t1 = lambda^2 - x1; t0 now free;
  Xi.sub3(t1, x2, x3);        // x3 = lambda^2 - x1 - x2; t1 now free;
  Xi.sub3(x1, x3, t0);        // t0 = x1 - x3;
  Xi.mul(lambda, t0, t1);     // t1 = lambda(x1 - x3); t0 now free;
  Xi.sub3(t1, y1, y3);        // y3 = lambda(x1 - x3) - y1; t1 now free;
  Xi.div(x3, N, t0, t1);      // t1 = x3 % N;
  Xi.div(y3, N, t0, t2);      // t2 = y3 % N;

  return Xl.makePoint(t1, t2);
}

let i1 = 1;
let j1 = 5;

let i2 = 1;
let j2 = 5;

let P = Xl.makePoint(Xi.make(i1), Xi.make(j1));
let Q = Xl.makePoint(Xi.make(i2), Xi.make(j2));
console.log("P = (" + P.point.x.toString() +", " + P.point.y.toString() + ")");
console.log("Q = (" + Q.point.x.toString() +", " + Q.point.y.toString() + ")");
let A = Xi.make(3);
let N = Xi.make(13);
let R = modAdd(P, Q, A, N);
if (R.point !== Infinity){
  console.log("R = (" + R.point.x.toString() +", " + R.point.y.toString() + ")");
} else {
  console.log(R.point);
}

// assert.deepStrictEqual(Xl.distinct(R, result), 0, "did not return (0,0)");
