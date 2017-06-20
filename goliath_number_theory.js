//this is the goliath number theoretic api
//this file contains the following algorithms
// pollard rho
// euclidean algorithm
// smallest factor
// Miller RaXint primality testing

(function(exports){
  'use strict';
  var BB = require('./bitBlocks');
  var Xint = require('./xint');

  //takes two GNs a and b, returns their greatest common divisor;
  function gcd(a, b){

    if (Xint.eq(b, Xint.ZERO)){
      return a;
    } else {
      let c = Xint.divmod(a, b).r;
      return (gcd(b, c));
    }
  }

  // function pollard(n){
  //   let i = 1;
  //   let num = Xint.stringToBits(n);
  //   let zero = Xint.ZERO;
  //   let one = Xint.ONE;
  //   let max = Xint.dec(num);
  //   let x = Xint.tenToBits(3);
  //   let y = x;
  //   let k = 2;
  //   var c;
  //   while (true) {
  //     i++;
  //     if (Xint.isEqual(x, zero)){
  //       x = max;
  //     } else {
  //       let a = Xint.pow(x, 2);
  //       let b = Xint.dec(a);
  //       x = Xint.divmod(b, num).r;
  //     }
  //     if (Xint.lt(x, y)){
  //        c = Xint.sub(y, x);
  //     } else {
  //        c = Xint.sub(x, y);
  //     }
  //     let d = euclid(c, num);
  //     //if (!Xint.isEqual(d, one) && !Xint.isEqual(d, num)){
  //       console.log(Xint.bitsToString(d));
  //     //}
  //     if (i === k) {
  //       y = x;
  //       k = 2 * k;
  //     }
  //   }
  // }

  function polP(n){
    let a = Xint.make(2);
    let b = 16;
    for (let j = 2; j < b; j++){
      a = Xint.modex(a, Xint.make(j), n);
      let b = Xint.sub(a, Xint.ONE)
      let d = gcd(b, n);
      if (Xint.lt(d, n) && Xint.gt(d, Xint.ONE)){
        return d;
      }
    }
    return "Failed to Factor N";
  }

  //pseudoprimality test
  function pseudoprimality(n){
    let i = Xint.make(2);
    let one = Xint.ONE;
    let exp = Xint.sub(n, one);
    if (Xint.eq(Xint.modex(i, exp, n), one)){
      return true;
    } else {
      return false;
    }
  }

  function primeFacPolP(n){
    let factors = [];
    let x = n;
    while (Xint.gt(x, Xint.ONE)){
      let a = polP(x);
      if (a === "Failed to Factor N"){
        if (pseudoprimality(a)){
          factors.push(a.toString());
        }
        return factors;
      } else if (Xint.gt(a, Xint.ONE)){
        factors.push(a.toString());
        x = Xint.divmod(n, a).q;
      }
    return factors;
    }
  }

  function expressWithTwos(n){
    r = {};
    m = Xint.sub(n, Xint.ONE);
    i = m.countBits() - 1;
    let j = 0;
    while (m.getBit(i) === 0){
      m = Xint.shiftRight(m, 1);
      j++
      i --;
    }
    r.j = j;
    r.q = m;
    return r;
  }

  function millerRabin(n){
    let two = Xint.make(2);
    let mOne = Xint.sub(n, Xint.ONE);
    let a = Xint.randRange(Xint.ZERO, n);
    let g = gcd(a, n);
    if (Xint.eq(Xint.divmod(n, two).r, Xint.ZERO)   ||
        (Xint.gt(g, Xint.ZERO) && Xint.lt(g, n))){
      return "COMPOSITE";
    }
    k = expressWithTwos(n);
    a = Xint.pow(a, k.q);
    if (Xint.eq(Xint.divmod(a, n).r, Xint.ONE)){
      return "TEST FAILS";
    }
    for (let i = 0; i < k.j; i++){
      if (Xint.eq(Xint.divmod(a, n).r, mOne)) {
        return "TEST FAILS";
      } else {
        a = Xint.divmod(Xint.pow(a, two), n).r;
      }
    }
    return "COMPOSITE";
  }

  exports.gcd = gcd;
  exports.polP = polP;
  exports.primeFac = primeFacPolP;
  // exports.pollard = pollard;
  exports.pseudoprimality = pseudoprimality;
  //exports.smallFac = smallFac;
  exports.millerRabin = millerRabin;
}) ((typeof exports === 'undefined') ? this.num = {} : exports);
