
// this is a very crude object pool
// idea is to allocate temporary xuints only if
// none are available
// requires functions that use them to be very careful
// to return (unget) and _not_ reuse local pointers
// to those objects after ungetting
let objPool = {
  stack: [],
  get: function() {
    if (this.stack.length > 0) {
      return this.stack.pop();
    } else {
      return make(1);
    }
  },
  unget: function (x) {
    this.stack.push(x);
    return null;
  }
};


function countBits(x) {
  let bits = ((x.nBlocks - 1) * BITS_PER_BLOCK) + 1;
  let y = x.blocks[x.nBlocks - 1];
  while (y >= 2) {
    bits++;
    y >>>= 1;
  }
  return bits;
}

// this does not use blocks...
// remains to be seen if overhead of that approach would be worth it
function divmodInto(dividend, divisor, q, r) {
  // assume divisor not 0!
  let i  = countBits(dividend);
  r.reset(0, true);
  q.reset(0, true);
  for (let i = countBits(dividend); i >= 0; i--) {
    shiftLeft(r, 1);
    r.setBit(0, dividend.getBit(i));
    shiftLeft(q, 1);
    if (compareTo(divisor, r) <= 0) {
      r.sub(y); // ...
      q.setBit(0);
    }
  }
}

function modExp(b, e, m, target) {
  let t = objPool.get();
  let scratch = objPool.get();
  let pow = b.copy();
  target.reset(1);
  for (let i = 0; i < e.nBlocks-1; i++) {
    let x = e.blocks[i];
    for (let j = 0; j < BITS_PER_BLOCK; j++) {
      if (x & 1) {
        multInto(target, pow, t);
        divmodInto(t, m, scratch, target);
      }
      multInto(pow, pow, t);
      divmodInto(t, m, scratch, pow);
      x >>>= 1;
    }
  }
  let x = e.blocks[e.nBlocks-1];
  while (x) {
    if (x & 1) {
      multInto(target, pow, t);
      divmodInto(t, m, scratch, target);
    }
    multInto(pow, pow, t);
    divmodInto(t, m, scratch, pow);
    x >>>= 1;
  }
  t = objPool.unget(t);
  scratch = objPool.unget(scratch);
  return target;
}
