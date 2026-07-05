# General Instructions

## TRANSLATION REQUIREMENT (STRICT RULE)
Every UI string, button label, notification message, error message, placeholder text, or user-facing copy MUST be:
1. Added to `messages/en.json` first.
2. Professionally translated to `messages/fr.json` (natural French, not word-for-word).
3. Professionally translated to `messages/ar.json` (Modern Standard Arabic, natural phrasing).
4. Integrated into the component using `useTranslations()` or `getTranslations()`.
5. Tested by switching the app language to French and Arabic and visually confirming the strings appear.

Do NOT merge any code that has hardcoded English strings. Every single user-facing string must be translatable.

## SERVER ERRORS
For error strings in server actions, do NOT translate them on the server. Instead:
- Return a structured error: `{ code: 'CANNOT_BUY_OWN_ITEM', message: null }`
- Client receives the code and translates it: `const msg = t('errors.CANNOT_BUY_OWN_ITEM')`
This way translations stay centralized in i18n files, not scattered in server code.
