# דנדן — חשבון לכיתה א'

אפליקציית ווב ללימוד חיבור וחיסור, עם דנדן הנשר כדמות מלווה.

- מסע על מפה: 40 תחנות בחמישה עולמות (ים, סוואנה, ג׳ונגל, הרים, שמיים). התחנה האחרונה בכל עולם היא אתגר חזרה.
- סוגי תרגילים: ספירה, חיבור, חיסור, מספר חסר והשלמה ל-10, השוואה (גדול/קטן/שווה) וסדרות.
- כל תחנה מקבלת 1–3 כוכבים (6, 8 או 10 נכונות מתוך 10). כוכב אחד מספיק כדי לפתוח את התחנה הבאה.
- הקראה בעברית (Web Speech API), רמזים חזותיים, ואוסף של 20 מדבקות.
- מסך הורה מוגן בקוד PIN, עם סטטיסטיקות לפי נושא, פתיחה ידנית של תחנות ואיפוס. נכנסים בלחיצה ארוכה על גלגל השיניים.

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
| `app/Game/Curriculum.php` | 40 התחנות: עולם, שם, סוגי התרגילים בכל תחנה, דירוג כוכבים |
| `app/Game/QuestionFactory.php` | יצירת תרגיל בודד מכל סוג, כולל תשובות לבחירה, הקראה ורמז |
| `app/Game/GameService.php` | התחלת סבב, בדיקת תשובות בשרת, דירוג ופתיחת תחנות |
| `config/dandan.php` | גודל סבב, כוכבים למדבקה |
| `resources/js/Pages/` | המסכים: בית, מסע, משחק, אוסף, הורה |
| `resources/js/Components/WorldScene.tsx` | הרקעים של חמשת העולמות |
| `resources/js/Components/Eagle.tsx` | דנדן הנשר (SVG) |
| `resources/js/lib/speech.ts` | הקראה והשתקה |

## פריסה

ראו [DEPLOYMENT.md](DEPLOYMENT.md).
