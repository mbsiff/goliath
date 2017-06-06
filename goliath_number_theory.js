//this is the goliath number theoretic api
//this file contains the following algorithms
// pollard rho
// euclidean algorithm
// smallest factor
// Miller Rabin primality testing

(function(exports){
  'use strict';
  var BB = require('./bitBlocks');
  var Bin = require('./binary');

  //takes two GNs a and b, returns their greatest common divisor;
  function euclid(a, b){
    let zero = Bin.tenToBits(0);
    if (Bin.isEqual(b, zero)){
      return a;
    } else {
      let c = Bin.divmod(a, b).r;
      return euclid(b, c);
    }
  }

  function pollard(n){
    let i = 1;
    let num = Bin.stringToBits(n);
    let zero = Bin.tenToBits(0);
    let one = Bin.tenToBits(1);
    let max = Bin.dec(num);
    let x = Bin.tenToBits(3);
    let y = x;
    let k = 2;
    var c;
    while (true) {
      i++;
      if (Bin.isEqual(x, zero)){
        x = max;
      } else {
        let a = Bin.pow(x, 2);
        let b = Bin.dec(a);
        x = Bin.divmod(b, num).r;
      }
      if (Bin.lt(x, y)){
         c = Bin.sub(y, x);
      } else {
         c = Bin.sub(x, y);
      }
      let d = euclid(c, num);
      //if (!Bin.isEqual(d, one) && !Bin.isEqual(d, num)){
        console.log(Bin.bitsToString(d));
      //}
      if (i === k) {
        y = x;
        k = 2 * k;
      }
    }
  }

  //pseudoprimality test
  function pseudoprimality(n){
    let i = Bin.tenToBits(2);
    let one = Bin.tenToBits(1);
    let exp = Bin.sub(n, one);
    if (Bin.isEqual(Bin.modex(i, exp, n), one)){
      return true;
    } else {
      return false;
    }
  }


  exports.euclid = euclid;
  exports.pollard = pollard;
  exports.pseudoprimality = pseudoprimality;
  //exports.smallFac = smallFac;
  //exports.millerRabin = millerRabin;
}) ((typeof exports === 'undefined') ? this.num = {} : exports);
