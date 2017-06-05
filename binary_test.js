var Bin = require('./binary');
var BB = require('./bitBlocks');
var numBin = require('./goliath_number_theory')

//returns the sum of the first n binary numbers;
function sum(n){
  var x = Bin.tenToBits(n);
  var i = Bin.tenToBits(1);
  var total = Bin.tenToBits(0);
  while (Bin.leq(i, x)){
    total = Bin.add(total, i);
    i = Bin.inc(i);
    console.log(total, i);
    console.log(Bin.bitsToString(total), Bin.bitsToString(i));
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

//returns an array of the first n powers of two (0 included)
function pow2(n){
  var i = 0;
  var powers = [];
  while (i <= n){
    powers.push(Bin.bitsToString(pow(Bin.tenToBits(2), i)));
    i++;
  }
  return powers;
}

//brute force primality test
function isPrime(n){
  let i = Bin.tenToBits(2);
  let one = Bin.tenToBits(1);
  let exp = Bin.sub(n, one);
  if (Bin.isEqual(Bin.modex(i, exp, n), one)){
    return true;
  } else {
    return false;
  }
}

//generates a list of n random numbers in the given range();
function rangGen(n, a, b){
  let randoms = [];
  for(let i = 0; i < n; i++){
    randoms.push(Bin.bitsToString(Bin.randomRange(a, b)));
  }
}

var x = randGen(10, 32, 64);
console.log(x);
