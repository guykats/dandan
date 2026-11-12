# פריסה להוסטינגר — dandan.guykats.com

אותו מבנה כמו ב-kats: הקוד יושב ב-`app/`, ו-`public_html` הוא קישור (symlink) לתיקיית `app/public`.
אחרי ההתקנה החד־פעמית, כל push ל-`main` עולה לאוויר אוטומטית.

## נתונים קבועים

| מה | ערך |
| --- | --- |
| SSH | `ssh -p 65002 u823311221@82.198.227.90` |
| תיקיית האפליקציה | `/home/u823311221/domains/dandan.guykats.com/app` |
| Webroot | `domains/dandan.guykats.com/public_html` ← `app/public` |
| PHP | `/opt/alt/php83/usr/bin/php` |
| ענף שהשרת מושך | `deploy` (נבנה ע״י GitHub Actions) |

## התקנה חד־פעמית (פעם אחת ב-SSH)

### 1. להריץ את ה-Action הראשון

ה-push הראשון ל-`main` מריץ את ה-workflow `Deploy to Production`.
הוא בונה את ה-assets ויוצר את הענף `deploy`.
הקריאה ל-webhook בסוף תיכשל הפעם, וזה צפוי: האתר עוד לא מותקן.
לוודא ב-GitHub → Actions שהשלב "Push code + built assets to deploy branch" עבר בהצלחה.

### 2. Clone לשרת

```bash
ssh -p 65002 u823311221@82.198.227.90

cd ~/domains/dandan.guykats.com
mkdir -p app && cd app
git clone https://github.com/guykats/dandan.git .
git checkout -B deploy origin/deploy

export PATH="/opt/alt/php83/usr/bin:$PATH"
php -v   # should report 8.3.x
composer install --no-dev --optimize-autoloader --no-interaction
```

### 3. קובץ `.env`

```bash
cp .env.production.example .env
nano .env
```

למלא את הערכים האלה (סיסמת ה-DB וה-PIN נכתבים רק כאן, לא בגיט):

```
APP_URL=https://dandan.guykats.com
DB_HOST=localhost
DB_DATABASE=u823311221_xxxx      # the DB name from hPanel
DB_USERNAME=u823311221_xxxx      # the DB user from hPanel
DB_PASSWORD=...
PARENT_PIN=....                  # 4 digits for the parent screen
```

ואז:

```bash
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. לחבר את `public_html` ל-Laravel

```bash
cd ~/domains/dandan.guykats.com
ls -A public_html          # must be empty (Hostinger may put a default index.php here)
rm -rf public_html         # only after confirming it holds nothing you need
ln -s app/public public_html
```

### 5. בדיקה

לפתוח את https://dandan.guykats.com. אמור להופיע דנדן הנשר.
אם משהו לא עובד: `~/domains/dandan.guykats.com/app/storage/logs/laravel.log`.

## הקראה בעברית (Google Cloud)

השרת מייצר את הקול בעזרת Google Cloud Text-to-Speech ושומר כל משפט ב-`storage/app/private/tts`, כך שכל משפט נשלח ל-Google פעם אחת בלבד.
בלי הגדרה, או אם Google לא זמין, האפליקציה חוזרת לקול של הדפדפן.

1. ב-[Google Cloud Console](https://console.cloud.google.com) יוצרים פרויקט חדש (למשל `dandan`).
2. **Billing**: מחברים חשבון חיוב לפרויקט. Google דורשת את זה גם כשהשימוש בתוך המכסה החינמית.
3. **APIs & Services → Library** → מחפשים **Cloud Text-to-Speech API** → **Enable**.
4. **APIs & Services → Credentials → Create credentials → API key**. אחר כך **Edit API key**:
   - **API restrictions** → Restrict key → לסמן רק **Cloud Text-to-Speech API**.
5. **Billing → Budgets & alerts** → תקציב של 1$ עם התראה במייל. זו רשת ביטחון: התקציב מתריע ולא חוסם.
6. ב-`.env` בשרת:

```
TTS_DRIVER=google
GOOGLE_TTS_KEY=...                       # the API key
GOOGLE_TTS_VOICE=he-IL-Chirp3-HD-Aoede   # see voices below
```

7. `php artisan config:cache`, ואז באזור ההורים אמור להופיע "הקראה מהשרת (Google)". לוחצים "בדיקת קול".

**החלפת קול:** הקולות של Chirp 3 HD נקראים `he-IL-Chirp3-HD-<שם>`, למשל Aoede, Kore או Leda (נשיים), Puck או Charon (גבריים).
את הרשימה המלאה אפשר לשמוע בדף ההדגמה של Google. אחרי שינוי מריצים שוב `php artisan config:cache`.
**מהירות:** `TTS_RATE` (ברירת מחדל 0.8, כלומר 20% לאט מהרגיל; 1.0 זו מהירות רגילה). במעבדת הקול באזור ההורים אפשר לנסות מהירויות שונות.
אם קול כלשהו מחזיר שגיאה, אפשר לנסות `TTS_RATE=1`, או קול ותיק יותר כמו `he-IL-Wavenet-A`.

**חלופה: Azure.** מגדירים `TTS_DRIVER=azure` עם `AZURE_SPEECH_KEY` ו-`AZURE_SPEECH_REGION` (משאב Speech בשכבה Free F0).

## פריסות אוטומטיות

בכל push ל-`main`:

1. ה-Action בונה את ה-assets (`npm ci && npm run build`). אין Node בשרת.
2. הוא דוחף את הקוד יחד עם `public/build` לענף `deploy`.
3. הוא קורא ל-`POST https://dandan.guykats.com/deploy-webhook`. השרת מושך את `deploy`, מריץ `composer install`, `migrate` ומרענן את ה-caches.

ה-webhook לא דורש סוד: הוא רק מושך קוד שכבר פומבי בענף `deploy`, ומוגן בנעילה מפני ריצות כפולות.

## אם פריסה נתקעה

1. לבדוק ב-GitHub Actions את השלב "Trigger the server to pull and deploy". הוא מציג את תשובת ה-webhook.
2. גיבוי ידני בשרת:

```bash
export PATH="/opt/alt/php83/usr/bin:$PATH"
cd ~/domains/dandan.guykats.com/app
/bin/bash deploy/pull-deploy.sh
```

## הערות

- `APP_DEBUG=false` בפרודקשן (כבר מוגדר ב-`.env.production.example`).
- אין צורך ב-queue worker או cron.
- להחלפת קוד ההורה: לשנות את `PARENT_PIN` ב-`.env` ולהריץ `php artisan config:cache`.
