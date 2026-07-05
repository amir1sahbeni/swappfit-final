const fs = require('fs');

const path = 'app/search/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Add translation hooks
content = content.replace(
  "const t = useTranslations('Search')",
  "const t = useTranslations('Search')\n  const tCat = useTranslations('Categories')\n  const tSize = useTranslations('Sizes')"
);

// Search title
content = content.replace(
  '<h1 className="text-2xl font-bold tracking-tight text-foreground">Search</h1>',
  '<h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>'
);

// Items button
content = content.replace(
  /Items\n\s*<\/button>/,
  "{t('items')}\n        </button>"
);

// People button
content = content.replace(
  /People\n\s*<\/button>/,
  "{t('people')}\n        </button>"
);

// Kids (Under 35)
content = content.replace(
  /<option value="Kids \(Under 35\)">Kids \(Under 35\)<\/option>/,
  '<option value="Kids (Under 35)">{tSize("Kids (Under 35)")}</option>'
);

// Kids
content = content.replace(
  /<option value="Kids">Kids<\/option>/g,
  '<option value="Kids">{tSize("Kids")}</option>'
);

// Categories
content = content.replace(
  /\{cat\}\n\s*<\/button>/,
  "{tCat(cat as any)}\n              </button>"
);

fs.writeFileSync(path, content);
console.log('Fixed search page tsx');
