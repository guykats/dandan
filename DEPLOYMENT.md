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
