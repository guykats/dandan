using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Builds the entire 2D map screen at runtime — no prefabs, no serialized refs.
/// Click detection uses RectTransformUtility.RectangleContainsScreenPoint so it
/// works regardless of EventSystem / input-handling configuration.
/// </summary>
public class MapScreen : MonoBehaviour
{
    private Sprite _circle;
    private RectTransform _glowRT;
    private Image         _glowImg;
    private float         _glowBase;

    // Click detection — keyed by level number
    private readonly Dictionary<int, RectTransform> _nodeRects  = new();
    private readonly Dictionary<int, Image>         _nodeImages = new();
    private readonly bool[] _unlocked = { true, false, false, false, false, false };

    // ── Palette ──────────────────────────────────────────────────────────────
    static readonly Color CSky0  = new Color(0.10f, 0.25f, 0.62f);
    static readonly Color CSky1  = new Color(0.18f, 0.46f, 0.84f);
    static readonly Color CSky2  = new Color(0.32f, 0.66f, 0.94f);
    static readonly Color CGrass = new Color(0.18f, 0.58f, 0.26f);
    static readonly Color CPath  = new Color(0.95f, 0.80f, 0.42f);
    static readonly Color CLock  = new Color(0.48f, 0.51f, 0.58f);
    static readonly Color CGold  = new Color(1.00f, 0.78f, 0.00f);

    static readonly Color[] CNode =
    {
        new Color(1.00f, 0.62f, 0.00f), // 1 amber
        new Color(0.14f, 0.72f, 0.36f), // 2 emerald
        new Color(0.10f, 0.50f, 0.92f), // 3 royal blue
        new Color(0.68f, 0.16f, 0.78f), // 4 purple
        new Color(0.94f, 0.24f, 0.22f), // 5 red
        new Color(0.92f, 0.52f, 0.02f), // 6 orange
    };

    // ── Node layout (normalized 0-1 within map area) ─────────────────────────
    static readonly Vector2[] NodePos =
    {
        new Vector2(0.22f, 0.08f),
        new Vector2(0.70f, 0.23f),
        new Vector2(0.23f, 0.40f),
        new Vector2(0.69f, 0.56f),
        new Vector2(0.22f, 0.72f),
        new Vector2(0.70f, 0.87f),
    };

    const float NodeDiameter = 148f;
    const float GlowExtra    = 44f;
    const float ShadowShift  = 7f;
    const float MapW = 1080f;
    const float MapH = 1920f * 0.89f;

    // ─────────────────────────────────────────────────────────────────────────

    void Awake()
    {
        _circle = MakeCircleSprite(256);

        EnsureEventSystem();
        var canvas = MakeCanvas();

        BuildBackground(canvas);
        BuildHeader(canvas);
        var map = MakeMapArea(canvas);
        BuildPaths(map);
        for (int i = 0; i < 6; i++) BuildNode(map, i);

        StartCoroutine(PulseGlow());
    }

    // ── Circle sprite ─────────────────────────────────────────────────────────

    static Sprite MakeCircleSprite(int size)
    {
        var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        float cx = size * 0.5f, cy = size * 0.5f, r = size * 0.5f - 1f;
        var px = new Color[size * size];
        for (int y = 0; y < size; y++)
        for (int x = 0; x < size; x++)
        {
            float dx = x + 0.5f - cx, dy = y + 0.5f - cy;
            float alpha = Mathf.Clamp01(r - Mathf.Sqrt(dx * dx + dy * dy) + 1.5f);
            px[y * size + x] = new Color(1f, 1f, 1f, alpha);
        }
        tex.SetPixels(px);
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, size, size), Vector2.one * 0.5f, 100f);
    }

    // ── EventSystem ──────────────────────────────────────────────────────────

    void EnsureEventSystem()
    {
        if (FindObjectOfType<EventSystem>() != null) return;
        var go = new GameObject("EventSystem");
        go.AddComponent<EventSystem>();
        go.AddComponent<StandaloneInputModule>();
    }

    // ── Canvas ───────────────────────────────────────────────────────────────

    GameObject MakeCanvas()
    {
        var go = new GameObject("Canvas");
        var cv = go.AddComponent<Canvas>();
        cv.renderMode = RenderMode.ScreenSpaceOverlay;
        var sc = go.AddComponent<CanvasScaler>();
        sc.uiScaleMode         = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        sc.referenceResolution = new Vector2(1080, 1920);
        sc.matchWidthOrHeight  = 0.5f;
        go.AddComponent<GraphicRaycaster>();
        return go;
    }

    // ── Background ───────────────────────────────────────────────────────────

    void BuildBackground(GameObject canvas)
    {
        Band(canvas, "Sky0", CSky0,  0.62f, 1.00f);
        Band(canvas, "Sky1", CSky1,  0.38f, 0.62f);
        Band(canvas, "Sky2", CSky2,  0.12f, 0.38f);
        Band(canvas, "Grass",CGrass, 0.00f, 0.12f);

        Cloud(canvas, 0.15f, 0.90f, 75f);
        Cloud(canvas, 0.58f, 0.94f, 62f);
        Cloud(canvas, 0.75f, 0.82f, 55f);
    }

    void Band(GameObject parent, string name, Color col, float yMin, float yMax)
    {
        var go  = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var img = go.AddComponent<Image>();
        img.color = col;
        img.raycastTarget = false;
        var rt  = go.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, yMin);
        rt.anchorMax = new Vector2(1, yMax);
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }

    void Cloud(GameObject canvas, float ax, float ay, float baseH)
    {
        float[] sx = { 0f,      baseH * 0.65f, baseH * 1.25f };
        float[] sy = { 0f,      baseH * 0.28f, 0f             };
        float[] sc = { 1.35f,   1.60f,         1.20f          };
        for (int i = 0; i < 3; i++)
        {
            var go  = new GameObject("Cloud");
            go.transform.SetParent(canvas.transform, false);
            var img = go.AddComponent<Image>();
            img.sprite = _circle;
            img.color  = new Color(1f, 1f, 1f, 0.82f);
            img.raycastTarget = false;
            var rt  = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(ax, ay);
            rt.sizeDelta = new Vector2(baseH * sc[i], baseH);
            rt.anchoredPosition = new Vector2(sx[i], sy[i]);
        }
    }

    // ── Header ───────────────────────────────────────────────────────────────

    void BuildHeader(GameObject canvas)
    {
        var bar = new GameObject("HeaderBar");
        bar.transform.SetParent(canvas.transform, false);
        var barImg = bar.AddComponent<Image>();
        barImg.color = new Color(0f, 0f, 0f, 0.42f);
        barImg.raycastTarget = false;
        var barRT = bar.GetComponent<RectTransform>();
        barRT.anchorMin = new Vector2(0, 0.91f);
        barRT.anchorMax = Vector2.one;
        barRT.offsetMin = barRT.offsetMax = Vector2.zero;

        var title = TMP(canvas, "Title", "מפת המסע", 76f, FontStyles.Bold,
                        Color.white, TextAlignmentOptions.Center, rtl: true);
        Anchors(title, 0.10f, 0.915f, 0.90f, 0.992f);

        var stars = TMP(canvas, "StarCount", "★  0", 52f, FontStyles.Bold,
                        CGold, TextAlignmentOptions.Right, rtl: false);
        Anchors(stars, 0.60f, 0.918f, 0.97f, 0.992f);
    }

    // ── Map area ─────────────────────────────────────────────────────────────

    GameObject MakeMapArea(GameObject canvas)
    {
        var go = new GameObject("MapArea");
        go.transform.SetParent(canvas.transform, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = new Vector2(1f, 0.91f);
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        return go;
    }

    // ── Dotted path ──────────────────────────────────────────────────────────

    void BuildPaths(GameObject map)
    {
        for (int i = 0; i < NodePos.Length - 1; i++)
            DottedLine(map, NodePos[i], NodePos[i + 1]);
    }

    void DottedLine(GameObject parent, Vector2 a, Vector2 b)
    {
        float dx  = (b.x - a.x) * MapW;
        float dy  = (b.y - a.y) * MapH;
        float len = Mathf.Sqrt(dx * dx + dy * dy);
        int   n   = Mathf.Max(2, Mathf.RoundToInt(len / 36f));

        for (int d = 0; d <= n; d++)
        {
            float t  = (float)d / n;
            var go   = new GameObject("Dot");
            go.transform.SetParent(parent.transform, false);
            var img  = go.AddComponent<Image>();
            img.sprite = _circle;
            img.color  = CPath;
            img.raycastTarget = false;
            var rt   = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = Vector2.Lerp(a, b, t);
            rt.sizeDelta = Vector2.one * 20f;
            rt.anchoredPosition = Vector2.zero;
        }
    }

    // ── Level node ───────────────────────────────────────────────────────────

    void BuildNode(GameObject map, int idx)
    {
        int   level    = idx + 1;
        bool  unlocked = _unlocked[idx];
        bool  isAdd    = level <= 3;
        Color col      = unlocked ? CNode[idx] : CLock;

        var root   = new GameObject("Node_" + level);
        root.transform.SetParent(map.transform, false);
        var rootRT = root.AddComponent<RectTransform>();
        rootRT.anchorMin = rootRT.anchorMax = NodePos[idx];
        rootRT.sizeDelta = Vector2.one * (NodeDiameter + GlowExtra + 20f);
        rootRT.anchoredPosition = Vector2.zero;

        // Glow ring (unlocked only)
        if (unlocked)
        {
            var gGO  = new GameObject("Glow");
            gGO.transform.SetParent(root.transform, false);
            _glowImg  = gGO.AddComponent<Image>();
            _glowImg.sprite = _circle;
            _glowImg.color  = new Color(col.r, col.g, col.b, 0.38f);
            _glowImg.raycastTarget = false;
            _glowRT  = gGO.GetComponent<RectTransform>();
            _glowRT.anchorMin = _glowRT.anchorMax = new Vector2(0.5f, 0.5f);
            _glowBase = NodeDiameter + GlowExtra;
            _glowRT.sizeDelta = Vector2.one * _glowBase;
            _glowRT.anchoredPosition = Vector2.zero;
        }

        // Drop shadow
        var shGO  = new GameObject("Shadow");
        shGO.transform.SetParent(root.transform, false);
        var shImg = shGO.AddComponent<Image>();
        shImg.sprite = _circle;
        shImg.color  = new Color(0f, 0f, 0f, 0.28f);
        shImg.raycastTarget = false;
        var shRT  = shGO.GetComponent<RectTransform>();
        shRT.anchorMin = shRT.anchorMax = new Vector2(0.5f, 0.5f);
        shRT.sizeDelta = Vector2.one * NodeDiameter;
        shRT.anchoredPosition = new Vector2(ShadowShift, -ShadowShift);

        // Main circle — hit target
        var main    = new GameObject("Circle");
        main.transform.SetParent(root.transform, false);
        var mainImg = main.AddComponent<Image>();
        mainImg.sprite = _circle;
        mainImg.color  = col;
        mainImg.raycastTarget = false; // we do our own hit-testing in Update()
        var mainRT  = main.GetComponent<RectTransform>();
        mainRT.anchorMin = mainRT.anchorMax = new Vector2(0.5f, 0.5f);
        mainRT.sizeDelta = Vector2.one * NodeDiameter;
        mainRT.anchoredPosition = Vector2.zero;

        // Register for click detection
        _nodeRects[level]  = mainRT;
        _nodeImages[level] = mainImg;

        // Inner highlight
        var hl    = new GameObject("Highlight");
        hl.transform.SetParent(main.transform, false);
        var hlImg = hl.AddComponent<Image>();
        hlImg.sprite = _circle;
        hlImg.color  = new Color(1f, 1f, 1f, 0.22f);
        hlImg.raycastTarget = false;
        var hlRT  = hl.GetComponent<RectTransform>();
        hlRT.anchorMin = hlRT.anchorMax = new Vector2(0.5f, 0.5f);
        hlRT.sizeDelta = Vector2.one * NodeDiameter * 0.58f;
        hlRT.anchoredPosition = new Vector2(-NodeDiameter * 0.14f, NodeDiameter * 0.14f);

        // Level number or lock
        var numGO  = TMP(main, "Num",
                         unlocked ? level.ToString() : "🔒",
                         unlocked ? 68f : 52f,
                         FontStyles.Bold, Color.white,
                         TextAlignmentOptions.Center, rtl: false);
        Stretch(numGO, Vector2.zero, Vector2.one);

        // Operation badge
        string opStr = isAdd ? "+" : "−";
        var bGO  = new GameObject("Badge");
        bGO.transform.SetParent(main.transform, false);
        var bImg = bGO.AddComponent<Image>();
        bImg.sprite = _circle;
        bImg.color  = Color.white;
        bImg.raycastTarget = false;
        var bRT  = bGO.GetComponent<RectTransform>();
        bRT.anchorMin = bRT.anchorMax = new Vector2(0.5f, 0.5f);
        bRT.sizeDelta = Vector2.one * 46f;
        bRT.anchoredPosition = new Vector2(NodeDiameter * 0.35f, NodeDiameter * 0.35f);

        var bTxtGO = TMP(bGO, "Op", opStr, 32f, FontStyles.Bold,
                         col, TextAlignmentOptions.Center, rtl: false);
        Stretch(bTxtGO, Vector2.zero, Vector2.one);

        // Stars row
        float starSz = 40f, gap = 4f;
        float rowW   = starSz * 3f + gap * 2f;
        for (int s = 0; s < 3; s++)
        {
            var sGO  = new GameObject("Star" + s);
            sGO.transform.SetParent(root.transform, false);
            var sTxt = sGO.AddComponent<TextMeshProUGUI>();
            sTxt.text      = "★";
            sTxt.fontSize  = 34f;
            sTxt.color     = (s == 0 && unlocked)
                             ? CGold
                             : new Color(CGold.r, CGold.g, CGold.b, 0.22f);
            sTxt.alignment = TextAlignmentOptions.Center;
            sTxt.raycastTarget = false;
            var sRT  = sGO.GetComponent<RectTransform>();
            sRT.anchorMin = sRT.anchorMax = new Vector2(0.5f, 0.5f);
            sRT.sizeDelta = new Vector2(starSz, starSz);
            float startX = -rowW * 0.5f + starSz * 0.5f;
            sRT.anchoredPosition = new Vector2(startX + s * (starSz + gap),
                                               -(NodeDiameter * 0.5f + 28f));
        }

        // Operation type label
        string opLabel = isAdd ? "חיבור" : "חיסור";
        var lblGO = TMP(root, "OpLabel", opLabel, 28f, FontStyles.Normal,
                        new Color(1f, 1f, 1f, 0.65f),
                        TextAlignmentOptions.Center, rtl: true);
        var lblRT = lblGO.GetComponent<RectTransform>();
        lblRT.anchorMin = lblRT.anchorMax = new Vector2(0.5f, 0.5f);
        lblRT.sizeDelta = new Vector2(NodeDiameter, 36f);
        lblRT.anchoredPosition = new Vector2(0f, -(NodeDiameter * 0.5f + 62f));

    }

    // ── Input (no EventSystem dependency) ────────────────────────────────────

    void Update()
    {
        if (!TryGetClickPos(out Vector2 pos)) return;

        foreach (var kv in _nodeRects)
        {
            int level = kv.Key;
            if (!_unlocked[level - 1]) continue;
            if (RectTransformUtility.RectangleContainsScreenPoint(kv.Value, pos, null))
            {
                OnLevelClicked(level);
                return;
            }
        }
    }

    static bool TryGetClickPos(out Vector2 pos)
    {
        if (Input.GetMouseButtonDown(0))       { pos = Input.mousePosition; return true; }
        if (Input.touchCount > 0 &&
            Input.GetTouch(0).phase == TouchPhase.Began)
                                               { pos = Input.GetTouch(0).position; return true; }
        pos = default;
        return false;
    }

    // ── Glow pulse ────────────────────────────────────────────────────────────

    IEnumerator PulseGlow()
    {
        if (_glowRT == null) yield break;
        float t = 0f;
        while (true)
        {
            t += Time.deltaTime * 1.6f;
            float sin = Mathf.Sin(t);
            _glowRT.sizeDelta = Vector2.one * (_glowBase * (1f + sin * 0.07f));
            var c = _glowImg.color;
            _glowImg.color = new Color(c.r, c.g, c.b, 0.26f + sin * 0.18f);
            yield return null;
        }
    }

    // ── Click handler ─────────────────────────────────────────────────────────

    void OnLevelClicked(int level)
    {
        Debug.Log($"[MapScreen] Level {level} clicked!");
        if (_nodeImages.TryGetValue(level, out var img))
            StartCoroutine(FlashNode(img));
        // TODO: load game scene for this level
    }

    IEnumerator FlashNode(Image img)
    {
        Color orig = img.color;
        img.color = Color.white;
        yield return new WaitForSeconds(0.12f);
        img.color = orig;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    GameObject TMP(GameObject parent, string name, string text, float size,
                   FontStyles style, Color col, TextAlignmentOptions align,
                   bool rtl)
    {
        var go  = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text              = text;
        tmp.fontSize          = size;
        tmp.fontStyle         = style;
        tmp.color             = col;
        tmp.alignment         = align;
        tmp.isRightToLeftText = rtl;
        tmp.raycastTarget     = false;
        return go;
    }

    void Anchors(GameObject go, float x0, float y0, float x1, float y1)
    {
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(x0, y0);
        rt.anchorMax = new Vector2(x1, y1);
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }

    void Stretch(GameObject go, Vector2 min, Vector2 max)
    {
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = min;
        rt.anchorMax = max;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }
}
