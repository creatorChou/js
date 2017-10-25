let a = 1

{
  console.log(a)
  let b = 2
}

// console.log(b)

const c = {}

c.prop = a

console.log(c.prop)

console.log(typeof x)
// let x

function bar(x = 2, y = x) {
  return [x, y]
}

console.log(bar())