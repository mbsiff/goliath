//This is the working code for Goliath, a big integer implementation for JS

//the fundamental idea is that we would like to be able to handle integers of
//arbitrary length - to that end we will represent integers not as number
//values but as strings (JS can handle strings of arbitrary length without
//issue). Our goal is to implement all of the standard mathematical methods
//one normally has access to when working with integers in JS.
//All binary arrays are oriented backwards, ie the least significant digit
//takes the left most position of the array

(function(exports){
  'use strict';

  //takes a JS integer, returns binary array
  function tenToBits(c){
    var x = c;
    var s = '';
    var i = 0;
    var b;
    if (x === 0){
      return [0];
    } else {
      while (x > 0){
        if (x % 2 === 1){
          s += '1';
        } else {
          s += '0';
        }
        x = Math.floor(x / 2);
        i ++;
      }
      b = s.split("");
      i = 0;
      while (i < b.length){
        b[i] = parseFloat(b[i]);
        i ++;
      }
      return b;
    }
  }

  //takes an array of Boolean values and returns a JS integer;
  function boolsToInt(a){
    var i = a.length;
    var b = 0;
    while (i >= 0){
      if (a[i]){
        b += Math.pow(2, i);
      }
      i --;
    }
    return b;
  }

  //takes two binary arrays and compares them to check for equality
  function compare(a, b){
    var i = 0;
    var breaker;
    if (a.length === b.length){
      breaker = true;
      while (i < a.length && breaker){
        if (a[i] === b[i]){
          i ++;
        } else {
          breaker = false;
          return false;
        }
      }
      if (breaker){
        return true;
      }
    } else {
      return false;
    }

  }

  //increments a boolean array representing a binary number in the usual way by 1
  function incBools(a){
    var i = 0;
    var carry = true;
    var bools =[];
    while (i < a.length){
      bools[i] = a[i];
      i ++;
    }
    i = 0;
    while (carry && i < bools.length) {
        carry = bools[i];
        bools[i] = !bools[i];
        i ++;
    }
    if (carry) {
        bools.push(true);
    }
    return bools;
  }
  //this is a silly way to do this if we have the add function;
/*  function inc(c){
    var i = 0;
    var a = c.slice(0,c.length);
    var b = [1];
    var carry = 0;
    var n = [];
    while (a.length > b.length){
      b.push(0);
    }
    while (i < a.length){
      if ((a[i] + b[i] + carry) < 2) {
        n[i] = a[i] + b[i] + carry;
        carry = 0;
      } else {
        n[i] = a[i] + b[i] + carry - 2;
        carry = 1;
      }
      i ++;
    }
    if (carry === 1){
      n.push(1);
    }
    return n;
  } */

  //smarter inc function
  function inc(c){
    return add([1], c);
  }

  //first draft of decrement function;
  function dec(c){
    return sub(c, [1]);
  }

  //takes two binary arrays x,y - if x > y, true; else false;
  function gt(x, y){
    var i = x.length;
    var breaker = true;
    var result;
    if (x.length > y.length){
      result = true;
    } else if (y.length > x.length){
      result = false;
    } else{
      while (i >= 0 && breaker){
        if (x[i] === y[i]){
          i --;
        } else if (x[i] > y[i]){
          breaker = false;
          result =  true;
        } else {
          breaker = false;
          result =  false;
        }
      }
    }
    return result;
  }

  //takes two binary arrays x,y - if x < y, true; else false;
  function lt(x, y){
    var i = x.length;
    var breaker = true;
    if (x.length < y.length){
      return true;
    } else if (y.length < x.length){
      return false;
    } else{
      while (i >= 0 && breaker){
        if (x[i] === y[i]){
          i --;
        } else if (x[i] < y[i]){
          return true;
        } else {
          return false;
        }
      }
    }
  }

  //takes two binary arrays x,y  - if x <= y, true; else false;
  function leq(x, y){
    if (compare(x, y)){
      return true;
    } else {
      return lt(x, y)
    }
  }

  //takes two binary arrays x,y - if x  >= y, true; else false;
  function geq(x, y){
    if (compare(x, y)){
      return true;
    } else {
      return gt(x, y);
    }
  }

  //takes two binary numbers x,y; returns a binary number x+y;
  function add(x, y){
    var i = 0;
    var a = x.slice(0, x.length);
    var b = y.slice(0, y.length);
    var z = [0];
    var carry = 0;
    if (a.length > b.length){
      while (b.length < a.length){
        b.push(0);
      }
    } else if (a.length < b.length){
      while (a.length < b.length){
        a.push(0);
      }
    }
    while (i < a.length){
      if ((a[i] + b[i] + carry) < 2) {
        z[i] = a[i] + b[i] + carry;
        carry = 0;
      } else {
        z[i] = a[i] + b[i] + carry - 2;
        carry = 1;
      }
      i ++;
    }
    if (carry === 1){
      z.push(1);
    }
    return z;
  }

  //takes two binary numbers x,y and returns the value (x - y)
  //assumes that a > b
  function sub(x, y){
    var i = 0;
    var a = x.slice(0, x.length);
    var b = y.slice(0, y.length);
    var z = [0];
    var borrow = 0;
    var temp;
    var breaker;
    while (a.length > b.length){
      b.push(0);
    }
    while (i < a.length){
      if ((a[i] - b[i]) >= 0) {
        z[i] = a[i]- b[i];
      } else {
        temp = i;
        while (a[temp] - b[temp] < 0){
          if (a[i + 1] === 0){
            i ++;
          } else {
            a[i + 1] --;
            a[i] = 2;
            i = temp;
          }
        }
        i = temp;
        z[i] = a[i] - b[i];
        }
      i ++;
    }

    i = z.length - 1;
    while (z[i] === 0 && i > 0){
      z.pop();
      i--;
    }

    return z;
  }

  //takes two binary numbers x,y; returns a binary number xy;
  function dot(x,y){
    var i = 0;
    var short, long;
    var xy = [];
    if (x.length > y.length){
      short = y;
      long = x;
    } else {
      short = x;
      long = y;
    }
    while (i < short.length){
      if (short[i] === 1){
        xy = add(xy, shiftLeft(long, i));
      }
      i ++;
    }
    return xy;
  }

  //takes two binary numbers x,y; returns an object of the form
  //{q:(x / y), r: (x % y)}
  function divmod(x,y){
    var i  = x.length - 1;
    var rem = [];
    var quo = [];
    while (i >= 0){
      rem = shiftLeft(rem, 1);
      rem[0] = x[i];
      quo = shiftLeft(quo, 1);
        if (leq(y, rem)){
          rem = sub(rem,y);
          quo[0] = 1;
        }
        i --;
    }
    return {q: quo, r: rem};
  }

  //converts an array of binary numbers into a string (so we can use integers
  // of arbitrary length!)
  function bitsToString(c){
    var digits = [];
    var ten = stringToBits("10");
    var n = c.slice(0, c.length);
    if (c.length === 1 && c[0] === 0){
      return '0';
    } else {
      while (gt(n, [0])){
        let q = divmod(n, ten).q;
        let r = divmod(n, ten).r;
        digits.push(bitsToTen(r));
        n = q;
      }
      return digits.reverse().join("");
    }
  }

  //takes a binary array x and normal integer n and produces x to the power n;
  function pow(x, n){
    var i = 1;
    var r = x;

    if (n === 0){
      r = [1];
    } else {
      while (i < n){
        r = dot(r, x);
        i++;
      }
    }
    return r;
  }

  //converts binary arrays to normal integers (use this for converting numbers
  //less than 10);
  function bitsToTen(c){
    var i = 0;
    var t = 0;
    var x = c.slice(0, c.length);
    while (i < x.length){
      if (x[i] === 1){
        t += Math.pow(2, i);
      }
      i++;
    }
    return t;
  }


  //returns the sum of the first n binary numbers;
  function sum(n){
    var x = tenToBits(n);
    var i = tenToBits(1);
    var total = tenToBits(0);
    while (leq(i, x)){
      total = add(total, i);
      i = inc(i);
    }
    return total;
  }

  //tester function returning the sum of the first n numbers in the usual way;
  function sumInt(n){
    var total = 0;
    var i = 0;
    while (i <= n){
      total += i;
      i ++;
    }
    return total;
  }

  //equivalent of <<
  function shiftLeft(c, n){
    var a = [];
    var i = 0;
    var m = 0;
    if (c.length === 1 && c[i] === 0){
      a = c;
    } else {
      while (m < n){
        a.push(0);
        m ++;
      }
      while (i < c.length){
        a.push(c[i]);
        i++;
      }
    }
    return a;
  }

  //equivalent of >>
  function shiftRight(c, n){
    return c.slice(n, c.length);
  }

  //takes a string of arbitrary length, assumed to be represneing a valid
  //integer, and returns that integers as a binary array;
  function stringToBits(s){
    var i = 0;
    var b = [];
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

  //returns an array of the first n powers of two (0 included)
  function pow2(n){
    var i = 0;
    var powers = [];
    while (i <= n){
      powers.push(bitsToString(pow([0,1], i)));
      i++;
    }
    return powers;
  }

  //brute force primality test
  function isPrime(n){
    var i = [0,1];
    var breaker = true;
    while (lt(pow(i, 2), n) && breaker){
      if (compare(divmod(n, i).r, [0])){
        breaker = false;
      }
      i = inc(inc(i));
      }
      return breaker;
    }

  //returns a number representing bitwise and of two numbers x and y
  function and(x, y){
    var z = [];
    var i = 0;
    var n;
    if (x.length > y.length){
      n = y;
    } else {
      n = x;
    }
    while (i < n.length){
      if (x[i] & y[i]){
        z.push(1);
      } else {
        z.push(0);
      }
      i++;
    }
    return z;
  }

  //returns a BN that is the bitwise OR of x and y
  function or(x, y){
    var z = [];
    var i = 0;
    var n;
    var m;
    if (x.length > y.length){
      n = y.length;
      m = x.length;
    } else {
      n = x.length;
      m = y.length;
    }
    while (i < n){
      if (x[i] | y[i]){
        z.push(1);
      } else {
        z.push(0)
      }
      i ++;
    }
    return z;
  }

  //returns a number that is the bitwise XOR of x and y
  function xor(x, y){
    var z = [];
    var i = 0;
    var n;

    if (x.length > y.length){
      n = x.length;
    } else {
      n = y.length;
    }

    while (i < n){
      if (x[i] ^ y[i]){
        z.push(1);
      } else {
        z.push(0)
      }
      i ++;
    }

    return z;
  }

  //compares x to y and returns 1 if x > y, 0 if x === y, -1 if x < y
  function compareTo(x, y){
    if (compare(x,y)){
      return 0;
    } else if (lt(x, y)){
        return -1;
    } else {
      return 1;
    }

  }

  function modex(base, power, modulus){

  }

  //generates a random k bit number
  function randomK(k){
    var z = [0];
    var i = 0;
    while (i < k){
      z = shiftLeft(z);
      if (Math.random() > .5){
        z[i] = 1;
      } else {
        z[i] = 0;
      }
      i ++;
    }

    return z;
  }

  //returns the kth bit of a number x
  function getBit(k, x){
    return x[k];
  }

  exports.getBit = getBit;
  exports.randomK = randomK;
  exports.and = and;
  exports.or = or;
  exports.xor = xor;
  exports.compareTo = compareTo;
  exports.modex = modex;
  exports.lt = lt;
  exports.gt = gt;
  exports.leq = leq;
  exports.geq = geq;
  exports.stringToBits = stringToBits;
  exports.bitsToString = bitsToString;
  exports.compare = compare;
  exports.add = add;
  exports.sub = sub;
  exports.dot = dot;
  exports.divmod = divmod;
  exports.pow = pow;
  exports.pow2 = pow2;
  exports.isPrime = isPrime;
  exports.shiftLeft = shiftLeft;
  exports.shiftRight = shiftRight;
  exports.tenToBits = tenToBits;
  exports.bitsToTen = bitsToTen;
  exports.inc = inc;
  exports.dec = dec;
  exports.sum = sum;
}) ((typeof exports === 'undefined') ? this.fib = {} : exports);
