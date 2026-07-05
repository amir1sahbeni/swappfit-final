const fs = require('fs');

const files = [
  { path: 'messages/en.json', translation: 'Jackets' },
  { path: 'messages/fr.json', translation: 'Vestes' },
  { path: 'messages/ar.json', translation: 'جاكيتات' }
];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
  if (data.Categories) {
    data.Categories.Jackets = file.translation;
    fs.writeFileSync(file.path, JSON.stringify(data, null, 2));
  }
}

console.log("Added Jackets to Categories in all locales.");
