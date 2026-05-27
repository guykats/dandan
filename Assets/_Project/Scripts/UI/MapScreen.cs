using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

/// <summary>
/// Builds the 3D map screen entirely at runtime.
/// No prefabs, no serialized refs, no Physics package required.
/// Click detection uses Camera.WorldToScreenPoint projection.
/// </summary>
public class MapScreen : MonoBehaviour
{
    // ── State ────────────────────────────────────────────────────────────────
    Camera _cam;
    readonly bool[] _unlocked = { true, false, false, false, false, false };
    readonly Dictionary<int, Vector3> _clickCenters = new();
    float _clickRadiusPx;

    Transform _glowTf;
    Material  _glowMat;
    float     _glowBaseScale;

    // ── Palette ──────────────────────────────────────────────────────────────
    static readonly Color[] CNode =
    {
        new Color(1.00f, 0.62f, 0.00f), // 1 amber
        new Color(0.14f, 0.72f, 0.36f), // 2 emerald
        new Color(0.12f, 0.50f, 0.92f), // 3 royal blue
        new Color(0.68f, 0.16f, 0.78f), // 4 purple
        new Color(0.94f, 0.24f, 0.22f), // 5 red
        new Color(0.92f, 0.52f, 0.02f), // 6 orange
    };
    static readonly Color CLocked = new Color(0.50f, 0.53f, 0.58f);
    static readonly Color CGold   = new Color(1.00f, 0.78f, 0.00f);
    static readonly Color CGrass  = new Color(0.22f, 0.62f, 0.22f);
    static readonly Color CPath   = new Color(0.90f, 0.76f, 0.42f);

    // ── Level world positions (zigzag, camera at -Z) ─────────────────────────
    static readonly Vector3[] NodePos =
    {
        new Vector3(-3.5f, 0f, -2f),
        new Vector3( 3.5f, 0f,  2f),
        new Vector3(-3.5f, 0f,  5.5f),
        new Vector3( 3.5f, 0f,  9f),
        new Vector3(-3.5f, 0f, 12.5f),
        new Vector3( 3.5f, 0f, 16f),
    };

    // ─────────────────────────────────────────────────────────────────────────

    void Awake()
    {
        SetupRender();
        _cam = SetupCamera();
        SetupLighting();
        BuildGround();
        BuildTrees();
        BuildRocks();
        BuildClouds();
        BuildPath();
        for (int i = 0; i < 6; i++) BuildNode(i);
        BuildHUD();
        _clickRadiusPx = ProjectedRadius(_clickCenters[1], 0.75f);
        StartCoroutine(PulseGlow());
    }

    // ── Render atmosphere ────────────────────────────────────────────────────

    void SetupRender()
    {
        RenderSettings.fog        = true;
        RenderSettings.fogMode    = FogMode.ExponentialSquared;
        RenderSettings.fogDensity = 0.016f;
        RenderSettings.fogColor   = new Color(0.58f, 0.78f, 0.98f);
        RenderSettings.ambientLight = new Color(0.52f, 0.50f, 0.46f);
    }

    // ── Camera ───────────────────────────────────────────────────────────────

    Camera SetupCamera()
    {
        var go  = new GameObject("MainCamera");
        go.tag  = "MainCamera";
        var cam = go.AddComponent<Camera>();
        cam.clearFlags      = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.45f, 0.70f, 0.98f);
        cam.fieldOfView     = 52f;
        cam.nearClipPlane   = 0.1f;
        cam.farClipPlane    = 80f;
        go.transform.SetPositionAndRotation(
            new Vector3(0f, 14f, -8f),
            Quaternion.Euler(52f, 0f, 0f));
        return cam;
    }

    // ── Lighting ─────────────────────────────────────────────────────────────

    void SetupLighting()
    {
        SpawnLight("Sun",  new Color(1.00f, 0.95f, 0.82f), 1.30f,  52f, -30f);
        SpawnLight("Fill", new Color(0.55f, 0.72f, 1.00f), 0.38f, -25f, 130f);
    }

    void SpawnLight(string n, Color col, float intensity, float pitch, float yaw)
    {
        var go = new GameObject(n);
        var lt = go.AddComponent<Light>();
        lt.type      = LightType.Directional;
        lt.color     = col;
        lt.intensity = intensity;
        go.transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
    }

    // ── Ground ───────────────────────────────────────────────────────────────

    void BuildGround()
    {
        // Main grass plane
        var g = P(PrimitiveType.Plane, "Ground",
                  new Vector3(0, -0.02f, 7f),
                  new Vector3(4.2f, 1f, 3.8f));
        Color(g, CGrass);

        // Slightly darker strip at far end (horizon shadow)
        var far = P(PrimitiveType.Plane, "GroundFar",
                    new Vector3(0, -0.015f, 20f),
                    new Vector3(4.2f, 1f, 1.5f));
        Color(far, new Color(0.18f, 0.52f, 0.18f));
    }

    // ── Trees ────────────────────────────────────────────────────────────────

    void BuildTrees()
    {
        // Side rows
        float[] zz = { -1f, 2.5f, 6f, 9.5f, 13f, 16.5f };
        float[] sc = { 1.0f, 0.9f, 1.1f, 0.95f, 1.05f, 0.88f };
        for (int i = 0; i < zz.Length; i++)
        {
            Tree(new Vector3(-7.0f, 0f, zz[i]), sc[i]);
            Tree(new Vector3( 7.0f, 0f, zz[i]), sc[i < 3 ? i + 3 : i - 3]);
        }
        // Background fill
        Tree(new Vector3(-4.5f, 0f, 18.5f), 1.2f);
        Tree(new Vector3(  0f,  0f, 19.5f), 1.35f);
        Tree(new Vector3( 4.5f, 0f, 18.5f), 1.1f);
    }

    void Tree(Vector3 root, float s)
    {
        var trunk = P(PrimitiveType.Cylinder, "Trunk",
                      root + new Vector3(0, 0.65f * s, 0),
                      new Vector3(0.22f * s, 0.72f * s, 0.22f * s));
        Color(trunk, new Color(0.40f, 0.25f, 0.10f));

        // Lower canopy (wider)
        var c1 = P(PrimitiveType.Sphere, "Canopy",
                   root + new Vector3(0, 1.35f * s, 0),
                   new Vector3(1.15f * s, 1.10f * s, 1.15f * s));
        Color(c1, new Color(0.14f, 0.58f, 0.16f));

        // Upper canopy (narrower, slightly lighter)
        var c2 = P(PrimitiveType.Sphere, "CanopyTop",
                   root + new Vector3(0, 1.88f * s, 0),
                   new Vector3(0.72f * s, 0.80f * s, 0.72f * s));
        Color(c2, new Color(0.20f, 0.68f, 0.22f));
    }

    // ── Rocks ────────────────────────────────────────────────────────────────

    void BuildRocks()
    {
        Rock(new Vector3(-5.5f, 0f,  0.5f));
        Rock(new Vector3( 5.2f, 0f,  3.8f));
        Rock(new Vector3(-1.8f, 0f, 11.2f));
        Rock(new Vector3( 1.5f, 0f, 14.8f));
        Rock(new Vector3(-6.0f, 0f, 13.0f));
    }

    void Rock(Vector3 pos)
    {
        var r1 = P(PrimitiveType.Sphere, "Rock",
                   pos + new Vector3(0, 0.14f, 0),
                   new Vector3(0.48f, 0.30f, 0.58f));
        Color(r1, new Color(0.54f, 0.56f, 0.52f));
        var r2 = P(PrimitiveType.Sphere, "Rock2",
                   pos + new Vector3(0.28f, 0.09f, 0.1f),
                   new Vector3(0.30f, 0.18f, 0.36f));
        Color(r2, new Color(0.49f, 0.51f, 0.48f));
    }

    // ── Clouds ───────────────────────────────────────────────────────────────

    void BuildClouds()
    {
        Cloud(new Vector3(-5.5f, 9.5f,  4f));
        Cloud(new Vector3( 3.0f, 10.0f, 9f));
        Cloud(new Vector3(-2.0f, 9.2f, 15f));
        Cloud(new Vector3( 6.0f, 9.8f, 13f));
    }

    void Cloud(Vector3 center)
    {
        float[] xs = { 0f,  0.65f, 1.20f, 0.35f };
        float[] ys = { 0f,  0.32f, 0.05f, 0.52f };
        float[] sz = { 1.0f, 1.30f, 0.95f, 0.78f };
        for (int i = 0; i < 4; i++)
        {
            var c = P(PrimitiveType.Sphere, "Cloud",
                      center + new Vector3(xs[i], ys[i], 0),
                      new Vector3(sz[i] * 1.65f, sz[i], sz[i] * 1.25f));
            Color(c, Color.white);
        }
    }

    // ── Path ─────────────────────────────────────────────────────────────────

    void BuildPath()
    {
        for (int i = 0; i < NodePos.Length - 1; i++)
        {
            Vector3 a = NodePos[i], b = NodePos[i + 1];
            Vector3 dir = new Vector3(b.x - a.x, 0, b.z - a.z).normalized;
            Vector3 mid = (a + b) * 0.5f;
            float   len = Vector3.Distance(a, b);
            var rot = Quaternion.LookRotation(dir);

            // Road surface
            var road = P(PrimitiveType.Cube, "Road",
                         new Vector3(mid.x, 0.01f, mid.z),
                         new Vector3(1.05f, 0.04f, len * 0.90f));
            road.transform.rotation = rot;
            Color(road, CPath);

            // Road borders
            for (int side = -1; side <= 1; side += 2)
            {
                var border = P(PrimitiveType.Cube, "Border",
                               new Vector3(mid.x, 0.025f, mid.z),
                               new Vector3(0.08f, 0.04f, len * 0.90f));
                border.transform.rotation = rot;
                border.transform.position +=
                    rot * Vector3.right * side * 0.49f;
                Color(border, new Color(0.72f, 0.58f, 0.24f));
            }

            // Dashed center line
            int dashes = Mathf.Max(1, Mathf.RoundToInt(len / 0.9f));
            for (int d = 0; d < dashes; d++)
            {
                float t = (d + 0.5f) / dashes;
                Vector3 dp = Vector3.Lerp(a, b, t);
                var dash = P(PrimitiveType.Cube, "Dash",
                             new Vector3(dp.x, 0.035f, dp.z),
                             new Vector3(0.08f, 0.04f, 0.35f));
                dash.transform.rotation = rot;
                Color(dash, Color.white * 0.9f);
            }
        }
    }

    // ── Level node ───────────────────────────────────────────────────────────

    void BuildNode(int idx)
    {
        int   level    = idx + 1;
        bool  unlocked = _unlocked[idx];
        bool  isAdd    = level <= 3;
        UnityEngine.Color col = unlocked ? CNode[idx] : CLocked;
        Vector3 O = NodePos[idx]; // world origin for this node

        // Shadow blob on ground
        var shad = P(PrimitiveType.Sphere, "Shadow",
                     O + new Vector3(0.18f, 0.02f, 0.18f),
                     new Vector3(2.4f, 0.06f, 2.4f));
        Color(shad, new Color(0.06f, 0.12f, 0.06f));

        // Platform (flat cylinder)
        var plat = P(PrimitiveType.Cylinder, "Platform",
                     O + Vector3.up * 0.15f,
                     new Vector3(2.1f, 0.15f, 2.1f));
        Color(plat, Darken(col, 0.52f));

        // Rim ring on platform
        var rim = P(PrimitiveType.Cylinder, "Rim",
                    O + Vector3.up * 0.28f,
                    new Vector3(2.0f, 0.04f, 2.0f));
        Color(rim, Darken(col, 0.70f));

        // Glow sphere behind orb (unlocked only)
        const float orbY = 1.10f;
        if (unlocked)
        {
            _glowBaseScale = 1.82f;
            var glow = P(PrimitiveType.Sphere, "Glow",
                         O + Vector3.up * orbY,
                         Vector3.one * _glowBaseScale);
            _glowMat = glow.GetComponent<Renderer>().material;
            _glowMat.color = new Color(col.r * 0.85f, col.g * 0.85f, col.b * 0.85f);
            if (_glowMat.HasProperty("_BaseColor"))
                _glowMat.SetColor("_BaseColor", _glowMat.color);
            _glowTf = glow.transform;
        }

        // Main orb
        var orb = P(PrimitiveType.Sphere, "Orb_" + level,
                    O + Vector3.up * orbY,
                    Vector3.one * 1.28f);
        Color(orb, col);
        _clickCenters[level] = O + Vector3.up * orbY;

        // Specular highlight (small white sphere top-left)
        P(PrimitiveType.Sphere, "Specular",
          O + new Vector3(-0.30f, orbY + 0.38f, -0.30f),
          Vector3.one * 0.26f);
        // (white by default — no Paint needed)

        // Level number (3D TMP floating above orb)
        var numGO = new GameObject("LevelNum_" + level);
        numGO.transform.SetPositionAndRotation(
            O + new Vector3(0, orbY + 0.02f, -0.55f),
            _cam.transform.rotation);
        var numTMP = numGO.AddComponent<TextMeshPro>();
        numTMP.text      = unlocked ? level.ToString() : "🔒";
        numTMP.fontSize  = unlocked ? 4.8f : 3.8f;
        numTMP.fontStyle = FontStyles.Bold;
        numTMP.color     = UnityEngine.Color.white;
        numTMP.alignment = TextAlignmentOptions.Center;

        // Operation badge — small white sphere with colored +/− label
        string opStr = isAdd ? "+" : "−";
        var badgeSph = P(PrimitiveType.Sphere, "Badge",
                         O + new Vector3(0.58f, orbY + 0.58f, -0.35f),
                         Vector3.one * 0.44f);
        // White badge (left as default)

        var badgeGO = new GameObject("BadgeLabel");
        badgeGO.transform.SetPositionAndRotation(
            O + new Vector3(0.58f, orbY + 0.58f, -0.60f),
            _cam.transform.rotation);
        var badgeTMP = badgeGO.AddComponent<TextMeshPro>();
        badgeTMP.text      = opStr;
        badgeTMP.fontSize  = 3.2f;
        badgeTMP.fontStyle = FontStyles.Bold;
        badgeTMP.color     = col;
        badgeTMP.alignment = TextAlignmentOptions.Center;

        // "חיבור" / "חיסור" label below orb
        string opLabel = isAdd ? "חיבור" : "חיסור";
        var lblGO = new GameObject("OpLabel");
        lblGO.transform.SetPositionAndRotation(
            O + new Vector3(0, 0.42f, -0.45f),
            _cam.transform.rotation);
        var lblTMP = lblGO.AddComponent<TextMeshPro>();
        lblTMP.text      = opLabel;
        lblTMP.fontSize  = 2.2f;
        lblTMP.color     = new UnityEngine.Color(1f, 1f, 1f, 0.75f);
        lblTMP.alignment = TextAlignmentOptions.Center;
    }

    // ── HUD (Canvas Overlay) ─────────────────────────────────────────────────

    void BuildHUD()
    {
        if (FindObjectOfType<EventSystem>() == null)
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }

        var cvGO = new GameObject("HUD");
        var cv   = cvGO.AddComponent<Canvas>();
        cv.renderMode  = RenderMode.ScreenSpaceOverlay;
        cv.sortingOrder = 10;
        var sc = cvGO.AddComponent<CanvasScaler>();
        sc.uiScaleMode         = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        sc.referenceResolution = new Vector2(1080, 1920);
        sc.matchWidthOrHeight  = 0.5f;
        cvGO.AddComponent<GraphicRaycaster>();

        // Dark frosted header bar
        UI_Panel(cvGO, "HeaderBar",
                 new Vector2(0f, 0.91f), Vector2.one,
                 new UnityEngine.Color(0f, 0f, 0f, 0.45f));

        UI_TMP(cvGO, "Title", "מפת המסע", 76f, FontStyles.Bold,
               UnityEngine.Color.white, TextAlignmentOptions.Center,
               new Vector2(0.10f, 0.916f), new Vector2(0.90f, 0.995f));

        UI_TMP(cvGO, "Stars", "★  0", 52f, FontStyles.Bold,
               CGold, TextAlignmentOptions.Right,
               new Vector2(0.60f, 0.918f), new Vector2(0.97f, 0.993f));
    }

    // ── Glow pulse ────────────────────────────────────────────────────────────

    IEnumerator PulseGlow()
    {
        if (_glowTf == null) yield break;
        UnityEngine.Color.RGBToHSV(_glowMat.color, out float h, out float s, out _);
        float t = 0f;
        while (true)
        {
            t += Time.deltaTime * 1.6f;
            float sin  = Mathf.Sin(t);
            float v    = 0.70f + sin * 0.18f;
            var   col  = UnityEngine.Color.HSVToRGB(h, s, v);
            _glowMat.color = col;
            if (_glowMat.HasProperty("_BaseColor")) _glowMat.SetColor("_BaseColor", col);
            _glowTf.localScale = Vector3.one * (_glowBaseScale * (1f + sin * 0.07f));
            yield return null;
        }
    }

    // ── Click detection (no Physics package needed) ───────────────────────────

    float ProjectedRadius(Vector3 worldCenter, float worldRadius)
    {
        Vector3 sp = _cam.WorldToScreenPoint(worldCenter);
        Vector3 sr = _cam.WorldToScreenPoint(worldCenter + _cam.transform.right * worldRadius);
        return Vector2.Distance(sp, sr);
    }

    void Update()
    {
        if (!TryGetClick(out Vector2 click)) return;
        foreach (var kv in _clickCenters)
        {
            if (!_unlocked[kv.Key - 1]) continue;
            Vector3 sp = _cam.WorldToScreenPoint(kv.Value);
            if (sp.z < 0) continue;
            if (Vector2.Distance(click, new Vector2(sp.x, sp.y)) <= _clickRadiusPx)
            {
                OnLevelClicked(kv.Key);
                return;
            }
        }
    }

    static bool TryGetClick(out Vector2 pos)
    {
        if (Input.GetMouseButtonDown(0)) { pos = Input.mousePosition; return true; }
        if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began)
        { pos = Input.GetTouch(0).position; return true; }
        pos = default;
        return false;
    }

    // ── Click handler ─────────────────────────────────────────────────────────

    void OnLevelClicked(int level)
    {
        Debug.Log($"[MapScreen] Level {level} clicked!");
        // TODO: load game scene for this level
    }

    // ── Primitive factory ─────────────────────────────────────────────────────

    static GameObject P(PrimitiveType type, string name, Vector3 pos, Vector3 scale)
    {
        var go = GameObject.CreatePrimitive(type);
        go.name = name;
        go.transform.SetPositionAndRotation(pos, Quaternion.identity);
        go.transform.localScale = scale;
        Object.Destroy(go.GetComponent<Collider>());
        return go;
    }

    static void Color(GameObject go, UnityEngine.Color col)
    {
        var mat = go.GetComponent<Renderer>().material;
        mat.color = col;
        if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", col);
    }

    static UnityEngine.Color Darken(UnityEngine.Color c, float t) =>
        UnityEngine.Color.Lerp(UnityEngine.Color.black, c, t);

    // ── UI helpers ────────────────────────────────────────────────────────────

    static void UI_Panel(GameObject parent, string name,
                         Vector2 anchorMin, Vector2 anchorMax,
                         UnityEngine.Color col)
    {
        var go  = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var img = go.AddComponent<Image>();
        img.color = col;
        img.raycastTarget = false;
        var rt  = go.GetComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }

    static void UI_TMP(GameObject parent, string name, string text,
                       float size, FontStyles style,
                       UnityEngine.Color col, TextAlignmentOptions align,
                       Vector2 anchorMin, Vector2 anchorMax)
    {
        var go  = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text      = text;
        tmp.fontSize  = size;
        tmp.fontStyle = style;
        tmp.color     = col;
        tmp.alignment = align;
        tmp.raycastTarget = false;
        var rt  = go.GetComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }
}
