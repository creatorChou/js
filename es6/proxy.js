var pipe = (function() {
  return function (value) {
    var funcStack = [];
    var oproxy = new Proxy({}, {
      get (pipeObj, fnName) {
        if(fnName === 'get') {
          return funcStack.reduce(function(val, fn) {
            return fn(val);
          }, value);
        }
        funcStack.push(window[fnName]);
        return oproxy;
      }
    });
    return oproxy;
  }
}());


var double = n => n * 2;
var pow = n => n * n;

console.log(pipe(3).double.pow.get);