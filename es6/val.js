let obj = {};
let arr = [];

({ foo: obj.prop, bar: arr[1] } = { foo: 123, bar: 321 })

console.log(obj, arr)

var x = [[1, 2], [3, 4]].map(([a, b]) => a + b);
console.log(x)