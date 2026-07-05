const fs = require('fs');

const enFile = 'messages/en.json';
const frFile = 'messages/fr.json';
const arFile = 'messages/ar.json';

const en = JSON.parse(fs.readFileSync(enFile));
const fr = JSON.parse(fs.readFileSync(frFile));
const ar = JSON.parse(fs.readFileSync(arFile));

en.Categories = {
  "All": "All",
  "Tops": "Tops",
  "Bottoms": "Bottoms",
  "Shoes": "Shoes",
  "Outerwear": "Outerwear",
  "Accessories": "Accessories"
};
en.Sizes = {
  "Kids (Under 35)": "Kids (Under 35)",
  "Kids": "Kids"
};

fr.Categories = {
  "All": "Tout",
  "Tops": "Hauts",
  "Bottoms": "Bas",
  "Shoes": "Chaussures",
  "Outerwear": "Vêtements d'extérieur",
  "Accessories": "Accessoires"
};
fr.Sizes = {
  "Kids (Under 35)": "Enfants (Moins de 35)",
  "Kids": "Enfants"
};

ar.Categories = {
  "All": "الكل",
  "Tops": "بلايز",
  "Bottoms": "بناطيل",
  "Shoes": "أحذية",
  "Outerwear": "ملابس خارجية",
  "Accessories": "إكسسوارات"
};
ar.Sizes = {
  "Kids (Under 35)": "أطفال (أقل من 35)",
  "Kids": "أطفال"
};

fs.writeFileSync(enFile, JSON.stringify(en, null, 2));
fs.writeFileSync(frFile, JSON.stringify(fr, null, 2));
fs.writeFileSync(arFile, JSON.stringify(ar, null, 2));

console.log("Translation JSON files updated.");
