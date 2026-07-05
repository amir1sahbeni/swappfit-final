const fs = require('fs');
const path = 'app/exchange/[id]/exchange-view.tsx';
let content = fs.readFileSync(path, 'utf-8');
content = content.replace(/'\{tv\("yesCancel"\)\}'/g, 'tv("yesCancel")');
fs.writeFileSync(path, content);
console.log('Fixed exchange-view.tsx');
