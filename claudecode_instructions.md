# קיט הנחיות ל-Claude לפיתוח משחק החשבון

## קונטקסט פדגוגי ותרבותי
- **קהל יעד:** ילדים ישראלים בגילאי 5-8 (גן חובה עד כיתה ב').
- **שפה:** עברית בלבד (UI, טקסטים, קריינות קולית).
- **תרבות:** שימוש במטבע שקל (₪), אלמנטים ישראליים (פלאפל, חיות מקומיות, מדבקות).
- **גישה פדגוגית:** מיקרו-יחידות (הסבר -> תרגול מודרך ויזואלי -> תרגול מופשט).

## ארכיטקטורת קוד ב-Unity
1. **ארכיטקטורה מבוססת מנהלים (Managers):**
   - `GameManager`: ניהול סטייט המשחק, ה-Streak, וה-Adaptive Loop.
   - `UIManager`: שליטה על קנבסים, פופאפים, ואנימציות UI.
   - `RewardManager`: ניהול דאטה של מטבעות ואלבום המדבקות.
   - `AudioManager`: ניהול סאונד וקריינות בעברית.

2. **חוקי כתיבת קוד:**
   - כל מנהל חייב ליישם תבנית Singleton בטוחה (`Assets/_Project/Scripts/Helpers/Singleton.cs`).
   - קוד נקי מ-Garbage Collection (GC) ככל הניתן (שימוש ב-Caching ל-Coroutines ורכיבים).
   - הפרדה מוחלטת בין לוגיקה (Data) לבין תצוגה (UI).
   - אין לוגיקה בקובצי UI — UIManager מקבל הוראות בלבד מ-GameManager.

## מבנה הפרויקט
```
Assets/_Project/
├── Scripts/
│   ├── Core/       # GameManager, RewardManager
│   ├── UI/         # UIManager, AntiSpam, StickerAlbum
│   ├── Gameplay/   # TracingMechanic, AdaptiveLoop
│   └── Helpers/    # Singleton.cs, Extensions.cs
├── Prefabs/
├── Sprites/
├── Audio/
└── Scenes/
```

## אייג'נטים מומחים (Sub-Agents)

### אייג'נט 1 — הארכיטקט (Unity Core Architect)
- בניית מחלקות Singleton
- ניהול Adaptive Learning Loop (80% threshold)
- ניהול מערכת Streak + Super Mode

### אייג'נט 2 — המעצב הדינמי (UI & UX Specialist)
- מכניקת אנטי-ספאם (IEnumerator לנעילת כפתורים)
- אלבום מדבקות (Drag and Drop עם Snapping)
- Canvas Scaler לרזולוציות אנדרואיד שונות

### אייג'נט 3 — מפתח הטאץ' (Input & Tracing Expert)
- LineRenderer לציור ספרות על המסך
- מערכת Checkpoints (Colliders שקופים) לאימות סדר הציור
