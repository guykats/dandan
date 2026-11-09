# דנדן — חשבון לכיתה א'

אפליקציית ווב ללימוד חיבור וחיסור, עם דנדן הנשר כדמות מלווה.

- חיבור וחיסור עד 10 עם תפוחים לספירה. אחרי 3 סבבים ברצף עם 8 תשובות נכונות או יותר, עולים לרמת 20.
- הקראה בעברית (Web Speech API), כוכבים, ואוסף של 12 מדבקות בשלושה עולמות.
- מסך הורה מוגן בקוד PIN, עם סטטיסטיקות, שינוי רמה ואיפוס. נכנסים בלחיצה ארוכה על גלגל השיניים.

## סטאק

Laravel 13 · Inertia · React 19 · TypeScript · Tailwind 4 · MySQL. אותו סטאק כמו ב-kats.

## פיתוח מקומי

```bash
composer install
npm install
cp .env.example .env      # uses SQLite locally, PARENT_PIN=1234
php artisan key:generate
touch database/database.sqlite
php artisan migrate
composer run dev          # or: php artisan serve + npm run dev
```

בדיקות:

```bash
php artisan test
```

## מבנה

| קובץ | תפקיד |
| --- | --- |
| `app/Game/QuestionGenerator.php` | יצירת תרגילים ותשובות לבחירה |
| `app/Game/GameService.php` | התחלת סבב, בדיקת תשובות בשרת, כוכבים ועליית רמה |
| `config/dandan.php` | גודל סבב, כוכבים למדבקה, כלל העלייה ברמה |
| `resources/js/Pages/` | המסכים: בית, משחק, אוסף, הורה |
| `resources/js/Components/Eagle.tsx` | דנדן הנשר (SVG) |
| `resources/js/lib/speech.ts` | הקראה והשתקה |

## פריסה

ראו [DEPLOYMENT.md](DEPLOYMENT.md).
