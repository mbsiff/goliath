//This is the working code for Goliath, a big integer implementation for JS

//David Gentile, Michael Siff;
//We add our names

//the fundamental idea is that we would like to be able to handle integers of
//arbitrary length - to that end we will represent integers not as number
//values but as strings (JS can handle strings of arbitrary length without
//issue). Our goal is to implement all of the standard mathematical methods
//one normally has access to when working with integers in JS.
//All binary arrays are oriented backwards, ie the least significant digit
//takes the left most position of the array

(function(exports){
  'use strict';

  var BB = require('./bitBlocks');

  //*BASICS OF BITS*//

  //takes a JS integer, returns a Goliath number(hereby, GNs)
  function tenToBits(n){
    let size = 0;
    let m = n;
    if (n === 0){
      let bits = BB.makeBits(1);
      return bits;
    } else {
      while (m > 0){
        m = Math.floor(m / 2);
        size++;
      }
      let bits = BB.makeBits(size);
      m = n;
      for (let i = 0; i < size; i++){
        BB.setBit(bits, i, m % 2);
        m = Math.floor(m / 2);
      }
      return bits;
    }
  }

  //converts GNs to normal JS integers (use this for converting numbers
  //less than 10);
  function bitsToTen(x){
    var i = 0;
    var t = 0;
    while (i <= BB.countBits(x)){
      if (BB.getBit(x, i) === 1){
        t += Math.pow(2, i);
      }
      i++;
    }
    return t;
  }

  //takes a string of arbitrary length, assumed to be representing a valid
  //integer, and returns that integer as a GN;
  function stringToBits(s){
    let i = 0;
    let b = tenToBits(0);
    var x;
    while (i < s.length){
      if (s.charAt(i) !== ','){
        x = parseFloat(s.charAt(i));
        b = add(b, tenToBits(x));
        if (i + 1 < s.length){
          b = add(shiftLeft(b, 2), b);
          b = shiftLeft(b, 1);
        }
      }
        i ++;
      }
    return b;
  }

  //converts a GN into a string (so we can compute integers of arbitrary length!)
  function bitsToString(c){
    let digits = [];
    let ten = stringToBits('10');
    let zero = stringToBits('0');
    let n = c;
    if (c.countBits() === 1 && bitsToTen(c) === 0){
      return '0';
    } else {
      while (gt(n, zero)){
        let x = divmod(n, ten);
        let r = x.r;
        n = x.q;
        digits.push(bitsToTen(r));
      }
      return digits.reverse().join("");
    }
  }

  //generates a random k bit GN
  function randomK(k){
    let z = BB.makeBits(k);
    for (let i = 0; i < k; i++){
      if (Math.random() > 0.5){
        z.setBit(i, 1);
      }
    }
    return z;
  }

  //returns a random GN less than n and greater than m;
  function randomRange(m, n){
    let k = n.countBits();
    let j = m.countBits();
    let x = randomK(k);
    let y = divmod(x, n).r;
    y.setBit(j - 1, 1);
    return y;
  }

  //copies digit of a binary number from the kth bit onwards
  function copy(x, k){
    let n = x.countBits();
    let c = BB.makeBits(n);
    for (let i = k; i < n; i++){
      c.setBit(i, x.getBit(i));
    }
    return c;
  }

  //*Mathematical Order Operators*//

  //takes two binary arrays and compares them to check for equality
  function isEqual(a, b){
    if (compareTo(a, b) === 0){
      return true;
    } else {
      return false;
    }
  }

  //takes two binary arrays x,y - if x > y, true; else false;
  function gt(x, y){
    if (compareTo(x, y) === 1){
      return true;
    } else {
      return false;
    }
  }

  //takes two binary arrays x,y - if x < y, true; else false;
  function lt(x, y){
    if (compareTo(x, y) === -1){
      return true;
    } else {
      return false;
    }
  }

  //takes two binary arrays x,y  - if x <= y, true; else false;
  function leq(x, y){
    let z = compareTo(x, y);
    if (z === 0 || z === -1){
      return true;
    } else {
      return false;
    }
  }

  //takes two binary arrays x,y - if x  >= y, true; else false;
  function geq(x, y){
    let z = compareTo(x, y);
    if (z === 0 || z === 1){
      return true;
    } else {
      return false;
    }
  }

  //returns the maximum of two numbers x and y;
  function max(x, y){
    if (gt(x, y)){
      return x;
    } else {
      return y;
    }
  }

  //returns the minimum of x and y;
  function min(x, y){
    if (lt(x, y)){
      return x;
    } else {
      return y;
    }
  }


  //compares x to y and returns 1 if x > y, 0 if x === y, -1 if x < y
  function compareTo(x, y){
    let m = x.countBits();
    let n = y.countBits();
    if (m > n){
      return 1;
    } else if (n > m){
      return -1;
    } else {
      for (let i = n; i >= 0; i--) {
        if (x.getBit(i) > y.getBit(i)){
          return 1;
        } else if (x.getBit(i) < y.getBit(i)){
          return -1;
        }
      }
      return 0;
    }
  }

  //*Standard Algebraic Operations for the Positive Integers*//

  //increments a GN by 1;
  function inc(x){
    let n = x.countBits();
    let c = BB.makeBits(n + 1);
    let carry = 1;
    for (let i = 0; i < n; i++){
      let total = x.getBit(i) + carry;
      let sumBit = total % 2;
      c.setBit(i, sumBit);
      carry = (total - sumBit) / 2;
    }
    c.setBit(n, carry);
    return c;
  }

  //takes two binary numbers x,y; returns a binary number x+y;
  function add(x, y){
    let n = Math.max(x.countBits(), y.countBits());
    let c = BB.makeBits(n + 1);
    let carry = 0;
    for (let i = 0; i < n; i++){
      let total = BB.getBit(x, i) + BB.getBit(y, i) + carry;
      let sumBit = total % 2;
      BB.setBit(c, i, sumBit);
      carry = (total - sumBit) / 2;
    }
    BB.setBit(c, n, carry);
    return c;
  }

  //takes two GNs x,y (assumed that x > y) and returns the value (x - y)
  //assumes that a > b
  function sub(a, b) {
      let n = Math.max(a.countBits(), b.countBits());
      let c = BB.makeBits(n);
      let borrow = 0;
      for (let i = 0; i < n; i++) {
          let difference = (a.getBit(i) - borrow) - b.getBit(i);
          if (difference < 0) {
              borrow = 1;
              difference = difference + 2;   // 2 since we are using base 2
          } else {
              borrow = 0;
          }
          c.setBit(i, difference);
      }
      return c;
  }

  //decrements a binary array by 1;
  function dec(x){
    let n = x.countBits();
    let c = BB.makeBits(n + 1);
    let borrow = 1;
    for (let i = 0; i < n; i++){
      let difference = x.getBit(i) - borrow;
      if (difference < 0){
        borrow = 1;
        difference = difference + 2;
      } else {
        borrow = 0;
      }
      c.setBit(i, difference);
    }

    return c;
  }

  //takes two binary numbers x,y; returns a binary number xy;
  function mult(x, y){
    let m = x.countBits();
    let n = y.countBits();
    let c = BB.makeBits(m + n);
    let carry = 0;
    let k = 0;
    for (let j = 0; j < n; j++){
      k = j;
      carry = 0;
      if (y.getBit(j)){
        for (let i = 0; i < m; i++){
          let total = x.getBit(i) * y.getBit(j) + c.getBit(k) + carry;
          let sum = total % 2;
          c.setBit(k, sum);
          carry = (total - sum) / 2;
          k++;
        }
        c.setBit(k, carry);
      }
    }
    return c;
  }

  //takes two GN x,y; returns an object of the form
  //{q:(x / y), r: (x % y)}
  function divmod(x,y){
    if (y.countBits() === 1 && bitsToTen(y) === 0){
      throw new RangeError("Can't divide by 0!");
    } else {
      let i  = x.countBits();
      let rem = tenToBits(0);
      let quo = tenToBits(0);
      while (i >= 0){
        rem = shiftLeft(rem, 1);
        rem.setBit(0, x.getBit(i));
        quo = shiftLeft(quo, 1);
        if (leq(y, rem)){
          rem = sub(rem, y);
          quo.setBit(0, 1);
        }
        i --;
      }
      return {q: quo, r: rem};
    }
  }
  //takes a GN x and normal integer n and produces x to the power n;
  function pow(x, n){
    let r = x;
    if (n === 0){
      r = tenToBits(1);
    } else {
      for (let i = 1; i < n; i++){
        r = mult(r, x);
      }
    }
    return r;
  }

  //computes exponentiation for modular arithmetic (base/power are Goliath nums)
  //as with normal exponentiation, 0 to the 0 is undefined
  function modex(base, power, modulus){
    let c = tenToBits(0);
    let d = tenToBits(1);
    let two = tenToBits(2);
    for (let i = power.countBits() - 1; i >= 0; i--){
      c = mult(c, two);
      d = divmod(mult(d, d), modulus).r;
      if (power.getBit(i) === 1){
        c = inc(c);
        d = divmod(mult(d, base), modulus).r;
      }
    }
    return d;
  }

  //*BITWISE OPERATORS*//

  //analyzes two numbers on a bitwise level
  function bitwise(x, y, f){
    let n = Math.max(x.countBits(), y.countBits());
    let z = BB.makeBits(n);
    for (let i = 0; i < n; i++){
      z.setBit(i, (f(x.getBit(i), y.getBit(i))));
    }
    return z;
  }

  //returns bitwise AND of x, y
  function and(x, y){
    return bitwise(x, y, (x, y) => x & y);
  }

  //returns bitwise OR of x, y
  function or(x, y){
    return bitwise(x, y, (x, y) => x | y);
  }

  //returns bitwise XOR of x, y
  function xor(x, y){
    return bitwise(x, y, (x, y) => x ^ y);
  }

  //equivalent of <<
  function shiftLeft(c, n){
    if (c.countBits() === 1 && bitsToTen(c) === 0){
      return c;
    } else {
      let x = c.countBits();
      let a = BB.makeBits(x + n);
      let j = 0;
      for (let i = n; i < x + n; i++){
        a.setBit(i, c.getBit(j));
        j++;
      }
      return a;
    }
  }

  //equivalent of >>
  function shiftRight(c, n){
    if (c.countBits() === 1 && bitsToTen(c) === 0){
      return c;
    } else {
      let x = c.countBits();
      let a = BB.makeBits(x - n);
      let j = n;
      for (let i = 0; i < x - n; i++){
        a.setBit(i, c.getBit(j));
        j++;
      }
      return a;
    }
  }

  exports.copy = copy;
  exports.randomK = randomK;
  exports.randomRange = randomRange;
  exports.and = and;
  exports.or = or;
  exports.xor = xor;
  exports.compareTo = compareTo;
  exports.modex = modex;
  exports.lt = lt;
  exports.gt = gt;
  exports.leq = leq;
  exports.geq = geq;
  exports.max = max;
  exports.min = min;
  exports.stringToBits = stringToBits;
  exports.bitsToString = bitsToString;
  exports.isEqual = isEqual;
  exports.add = add;
  exports.sub = sub;
  exports.mult = mult;
  exports.divmod = divmod;
  exports.pow = pow;
  exports.shiftLeft = shiftLeft;
  exports.shiftRight = shiftRight;
  exports.tenToBits = tenToBits;
  exports.bitsToTen = bitsToTen;
  exports.inc = inc;
  exports.dec = dec;
}) ((typeof exports === 'undefined') ? this.bin = {} : exports);
