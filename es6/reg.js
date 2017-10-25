var reg1 = new RegExp(/abc/ig, 'i')
console.log(reg1)

let str = '𠮷𠮷';

console.log(str.length)

function codePointLength(text) {
  let result = text.match(/[\s\S]/gu);
  return result && result.length || 0;
}

console.log(codePointLength(str))