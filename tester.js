let EC = require('./elliptic')

let x = 144161 * 138401;
let numbers = [];

for (let i = 0; numbers.length < 100; i++){
  let x = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
  if (x % 2 !== 0){
    numbers.push(x);
  } else {
    x --;
    numbers.push(x);
  }
}

for (let i = 0; i < numbers.length; i++){
  let n = bruteForce(numbers[i]);
  let j = looper(numbers[i], 5000);
  console.log(numbers[i]);
  console.log("Brute Force: ", n);
  if (j!== null){
    console.log("Lenstra: ", j);
  }

}

function bruteForce(n){
  let fac = [];
  let ceiling = Math.floor(Math.sqrt(n));
  let i = 2;
  while (i < ceiling){
    if (n % i === 0){
      n = n / i;
      ceiling = Math.floor(Math.sqrt(n));
      fac.push(i);
      i = 2;
    }
    i++;
  }
  fac.push(n);
  return fac;
}


function lenstra(n, bound, coords){
  try {
    var x = 2;
    let P = EC.makePoint(coords.a, coords.b);
    for (let j = 2; j < bound; j++){
        let Q = EC.dubAdd(P, j, coords.A, n);
        P = Q;
        x = j;
    }
    return null;
  } catch (e) {
      if (typeof e === 'number'){
        let obj = {
          factor: e,
          iterate: x
        }
        return obj;
      } else {
        return null;
      }
    }
}

function looper(x, n){
  let bound = n;
  let myTuple = EC.randomCurve(x);
  let curve = "E(Z /"+x+" Z): y^2 = x^3 " + myTuple.A + "x + " + myTuple.B;
  let point = "(" + myTuple.a + ", " + myTuple.b + ")";
  var j;
  j = lenstra(x, bound, myTuple);
  if (j!== null){
    //console.log(j.e, j.j,curve, point);
    return j;
  } else {
    return null;
  }
}

var count = 0;

// for (let i = 0; i < 1000; i++){
//   let x = looper(5000);
//   if (typeof x === 'number'){
//     count += x;
//   }
// }
// console.log("Of 1000 elliptic curves, " + count
//             + " were succesful in factoring " + x);
