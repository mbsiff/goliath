//this is the goliath number theoretic api
//this file contains the following algorithms
// pollard rho
// euclidean algorithm
// smallest factor
// Miller Rabin primality testing

(function(exports)){
  'use strict';
  var BB = require('./bitBlocks');
  var Bin = require('./binary_1.1');

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

  exports.gcd = gcd;
  exports.pollard = pollard;
  exports.smallFac = smallFac;
  exports.millerRabin = millerRabin;
}) ((typeof exports === 'undefined')) ? this.fib = {} : exports;
