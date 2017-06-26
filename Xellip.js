(function(exports){
  'use strict';
  var Xi = require('./xi');

  const O = {point: Infinity};

  function randomCurve(n){
    let obj = {};
    obj.A = Math.floor(n * Math.random());
    obj.a = Math.floor(n * Math.random());
    obj.b = Math.floor(n * Math.random());
    obj.B = (Math.pow(obj.b, 2) - Math.pow(obj.a, 3) - obj.A * obj.a) % n;
    while (obj.B < 0){
      obj.B += n;
    }
    return obj;
  }

  function checkFiniteDis(a, b, n){
    let x = (4 * a * a * a) % n;
    let y = (27 * b * b) % n;
    let dis = (x + y)
    let j = exEuc(dis, n).gcd;
    if (j === 1){
      return true;
    } else if (j === n){
      return false;
    } else {
      throw j;
    }
  }

  function exEuc(a, b){
    let g = Xi.make();
    Xi.copy(a, g);
    let y = Xi.make();
    Xi.copy(b, y);
    var u = Xi.make(1);
    let x = Xi.make(0);
    let obj = {};
    let t = Xi.make();
    let s = Xi.make();
    let q = Xi.make();
    let v = Xi.make();
    let t0 = Xi.make();
    let t1 = Xi.make();
    while (!Xi.isZero(y)) {
      Xi.div(g, y, q, t);
      Xi.mul(q, x, t0);
      Xi.sub3(u, t0, s);
      let t2 = g;
      let t3 = u;
      u = x;
      g = y;
      x = s;
      y = t;
      t = t2;
      s = t3;
    }

    // v = (g - (a*u))/b;
    Xi.mul(a, u, t0);
    Xi.sub3(g, t0, t1);
    Xi.div(t1, b, v, t0);  // discard modulus t0

    if (u.sign === -1){
      //u = (u + b)/g;
      Xi.add3(u, b, t0);
      Xi.div(t0, g, u, t1);  // discard modulus t1

      //v = (v - a)/g;
      Xi.sub3(v, a, t0);
      Xi.div(t0, g, v, t1);  // discard modulus t1
    }
    obj.gcd = g;
    obj.inverse = u;
    obj.extras = v;
    return obj;
  }

  function makePoint(x, y){
    let obj = {};
    obj.point = {x: x, y: y};
    return obj;
  }

  function distinctPoints(P, Q, N){
    if (P.point === Infinity && Q.point === Infinity){
      return 0;
    } else if (P.point === Infinity || Q.point === Infinity){
      return 1;
    } else {
      let x1 = P.point.x;
      let x2 = Q.point.x;
      let y1 = P.point.y;
      let y2 = Q.point.y;
      if (Xi.eq(x1, x2) && Xi.eq(y1, y2)){
        return 0
      } else if (Xi.eq(x1, x2)){
        if (N === undefined && Xi.eq(y1, Xi.negate(y2))){
          return -1
        } else {
          let t = Xi.make();
          Xi.add3(y1, y2, t);
          Xi.div(t, N, y1, y2);
          if (Xi.isZero(y2)){
            return -1
          }
        }
      } else {
        return 1;
      }
    }
  }

  //Given an elliptic curve over a Finite Field, E(Fp), with paramters A and
  //modulus and two points on that curve P, Q, this function produces the
  //"sum" of those two points on E(Fp).
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

  //given an elliptic curve over a finite field and a point on the curve P,
  //quickly compues the value of nP for some constant multiple n by way of
  //repeated doubling and addition.
  function dubAdd(P, j, A, modulus){
    let Q = P;
    let R = O;
    while (j > 0){
      if (j % 2 === 1){
        R = modAdd(R, Q, A, modulus);
      }
      Q = modAdd(Q, Q, A, modulus);
      j = Math.floor(j / 2);
    }
    return R;
  }

  function lenstra(n, bound){
    try {
      let check = true;
      var coords;
      while (check){
        coords = randomCurve(n);
        check = !checkFiniteDis(coords.A, coords.B, n);
      }
      console.log("E(Z/NZ): y^2 = x^3 + " + coords.A + "x + " + coords.B +
                  "\nP = (" + coords.a+ ", " + coords.b +")");
      let P = makePoint(coords.a, coords.b);
      for (let j = 2; j < bound; j++){
          let Q = dubAdd(P, j, coords.A, n);
          P = Q;
        }
        return null;
      } catch (e) {
        if (typeof e === 'number'){
          return e;
        } else {
          return null;
        }
      }
  }

  exports.O = O;
  exports.modAdd = modAdd;
  exports.makePoint = makePoint;
  exports.dubAdd = dubAdd;
  exports.extended = exEuc;
  exports.lenstra = lenstra;
  exports.randomCurve = randomCurve;
  exports.distinct = distinctPoints;
})((typeof exports === 'undefined') ? this.EC = {} : exports);
