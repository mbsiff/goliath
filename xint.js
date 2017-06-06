(function(exports){
  'use strict';
  var BB = require('./bitBlocks');

  let zero = make(0);
  let one = make(1);

  function make(x){
    let obj = {};
    let n;
    if (typeof x === 'number'){
      let size = 0;
      let m = x;
      if (n === 0){
        let bits = BB.makeBits(1);
        n = bits;
      } else {
        while (m > 0){
          m = Math.floor(m / 2);
          size++;
        }
        let bits = BB.makeBits(size);
        m = x;
        for (let i = 0; i < size; i++){
          BB.setBit(bits, i, m % 2);
          m = Math.floor(m / 2);
        }
        n = bits;
      }
    } else {
      throw new TypeError("This type of input is not currently supported");
    }
    obj.toBinaryString = function(){
                        if (n.countBits() === 1 && n.getBit(0) === 0){
                          return '0';
                        } else {
                          let s =  n.toString();
                          let x = s.split("");
                          for (let i = x.length - 1; x[i] !== '1'; i--){
                            x.pop();
                          }
                          x.reverse();
                          return x.join("");
                        }
                      };
    return obj;
  }

  exports.make = make;
  exports.ZERO = zero;
  exports.ONE = one;
})((typeof exports === 'undefined') ? this.xint = {} : exports);
