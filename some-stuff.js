// def isProbablyPrime(n, iters = 4):
//     """Probabilistically checks whether n is prime.
//
//     Uses Miller-Rabin test. iters is the number of repetitions; if it
//     returns True then n is prime with probability at least 1/2^iters;
//     if False; then n is definitely composite.
//     """
//
//     if n % 2 == 0: return False
//     d = n - 1
//     while d & 1 == 0:
//         d = d >> 1
//     for i in range(iters):
//         a = random.randint(2, n-2)
//         t = d
//         y = pow(a,t,n)
//         while t != n-1 and y != 1 and y != n-1:
//             y = (y * y) % n
//             t = t << 1
//         if y != n-1 and t & 1 == 0:
//             return False
//     return True


// uses Miller-Rabin test. iters is the number of repetitions; if it
//     returns True then n is prime with probability at least 1/2^iters;
//     if False; then n is definitely composite.
// assumes n > 2
function millerRabin(n, iters=4) {
  if (getBit(n, 0) === 0) {
    return false;
  }
  let n1 = objPool.get();
  let d = objPool.get();
  let base = objPool.get();
  let pow = objPool.get();
  let exp = objPool.get();
  copy(n, n1);
  decrement(n1);
  copy(n1, d);
  while (getBit(d, 0) === 0) {
    shiftRight(d, 1);
  }
  let couldBePrime = true;
  for (let i = 0; couldBePrime && i < iters; i++) {
    let rp = PRIMES[Math.floor(Math.random() * PRIMES.length)];
    reset(base, rp, true);  // ...
    copy(d, exp);
    modExp(base, exp, n, pow);
    // might be possible to squeeze a little more out of this...
    while (!isOne(pow) && compareTo(pow, n1) && compareTo(exp, n1)) {
      mult(pow, pow, t);
      divmod(t, n, scratch, pow);
      shiftLeft(exp, 1);
    }
    couldBePrime = getBit(exp, 0) || compareTo(pow, n1) === 0;
  }
  exp = objPool.get(exp);
  pow = objPool.get(pow);
  base = objPool.get(base);
  d = objPool.unget(d);
  n1 = objPool.unget(n1);
  return couldBePrime;
}
