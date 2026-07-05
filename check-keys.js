const fs = require('fs');

const en = JSON.parse(fs.readFileSync('messages/en.json'));
const fr = JSON.parse(fs.readFileSync('messages/fr.json'));
const ar = JSON.parse(fs.readFileSync('messages/ar.json'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
    } else {
      keys.push(`${prefix}${key}`);
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(en));
const frKeys = new Set(getKeys(fr));
const arKeys = new Set(getKeys(ar));

let missingFr = [...enKeys].filter(x => !frKeys.has(x));
let missingAr = [...enKeys].filter(x => !arKeys.has(x));

console.log('Missing in FR:', missingFr);
console.log('Missing in AR:', missingAr);
