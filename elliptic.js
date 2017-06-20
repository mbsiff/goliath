(function(exports){
  'use strict';
  var BB = require('./bitBlocks');
  var Xint = require('./xint');
  var GNT = require('./goliath_number_theory');

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

  function checkDiscriminant(a, b){
    let x = 4 * a * a * a;
    let y = 27 * b * b;
    if (x + y === 0){
      return false;
    } else {
      return true;
    }
  }

  function exEuc(a, b){
    let g = a;
    let y = b;
    var u = 1;
    let x = 0;
    let obj = {};
    var t, s, q, v;
    while (y !== 0) {
      t = g % y;
      q = (g - t)/y;
      s = u - q * x;
      u = x;
      g = y;
      x = s;
      y = t;
    }
    v = (g - (a*u))/b;
    if (u < 0){
      u = (u + b)/g;
      v = (v - a)/g
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

  //takes two points P and Q, with curve parameter A, and produces
  //a new point that is the "sum" of these points by way of elliptic
  //curve addition.
  function add(P, Q, A){
    var lambda;
    let x1 = P.point.x;
    let x2 = Q.point.x;
    let y1 = P.point.y;
    let y2 = Q.point.y;
    if (P.point === Infinity){
      return Q;
    } else if (Q.point === Infinity){
      return P;
    } else if (x1 === x2 && y1 === (-1 * y2)){
      return O;
    } else {
      if (x1 !== x2 ||
          y1 !== y2){
            lambda = (y2 - y1) / (x2 - x1);
      } else {
            lambda = ((3 * x1 * x1) + A)/(2 * y1);
      }
      let x3 = (lambda * lambda) - x1 - x2;
      let y3 = (lambda * (x1 - x3)) - y1;
      return makePoint(x3, y3);
    }
  }

  function modLambda(P, Q, modulus){
    var lambda, delX, delY;
    let x1 = P.point.x;
    let y1 = P.point.y;
    let x2 = Q.point.x;
    let y2 = Q.point.y;

    if (distinct(P, Q)){
      if (Xint.lt(x2, x1)){
        let n = Xint.add(modulus, x2)
        delX = Xint.sub(n, x1);
      } else {
        delX = Xint.sub(x2 - x1);
      }
      if (Xint.lt(y2, y1)){
        let n = Xint.add(modulus, y2);
        delY = Xint.sub(n, y1);
      } else {
        delY = Xint.sub(y2, y1);
      }8
    } else {

    }

  }

  //Given an elliptic curve over a Finite Field, E(Fp), with paramters A and
  //modulus and two points on that curve P, Q, this function produces the
  //"sum" of those two points on E(Fp).
  function modAdd(P, Q, A, modulus){
    var lambda;
    let x1 = P.point.x;
    let x2 = Q.point.x;
    let y1 = P.point.y;
    let y2 = Q.point.y;
    if (P.point === Infinity){
      return Q;
    } else if (Q.point === Infinity){
      return P;
    } else if (x1 === x2 && (y1 + y2) % modulus === 0){
      return O;
    } else {
      if (x1 !== x2 ||
          y1 !== y2){
            let delY = y2 - y1;
            let delX = x2 - x1;
            if (delY < 0){
              delY += modulus;
            }
            if (delX < 0){
              delX += modulus;
            }
            let c = exEuc(delX, modulus);
            if (c.gcd > 1 && c.gcd < modulus){
              throw (c.gcd);
            } else if (c.gcd === modulus){
              throw new RangeError("Try a different elliptic curve");
            }
            lambda = (delY * c.inverse) % modulus;
      } else {
            let c = exEuc(2 * y1, modulus);
            if (c.gcd > 1 && c.gcd < modulus){
              throw (c.gcd);
            } else if (c.gcd === modulus){
              throw new RangeError("Try a different elliptic curve");
            }
            lambda = (((3 * x1 * x1) + A) * c.inverse) % modulus;
      }
      let x3 = ((lambda * lambda) - x1 - x2) % modulus;
      let y3 = ((lambda * (x1 - x3)) - y1) % modulus;
      if (x3 < 0){
        x3 += modulus;
      }
      if (y3 < 0){
        y3 += modulus;
      }
      return makePoint(x3, y3);
    }
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
  exports.add = add;
  exports.modAdd = modAdd;
  exports.makePoint = makePoint;
  exports.dubAdd = dubAdd;
  exports.extended = exEuc;
  exports.lenstra = lenstra;
  exports.randomCurve = randomCurve;
})((typeof exports === 'undefined') ? this.EC = {} : exports);
