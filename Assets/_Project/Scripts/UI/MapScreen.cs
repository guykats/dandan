using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

/// <summary>
/// Builds the entire map screen at runtime — no prefabs, no serialized references.
/// All GameObjects are created, configured, and wired in Awake().
/// </summary>
public class MapScreen : MonoBehaviour
{
    // Level config
    private const int TotalLevels = 6;
    private const int AdditionLevels = 3; // levels 1-3
    private const int Columns = 2;

    private static readonly Color ColorAddition    = new Color(0.2f, 0.75f, 0.3f); // green
    private static readonly Color ColorSubtraction = new Color(0.85f, 0.25f, 0.25f); // red
    private static readonly Color ColorLocked      = new Color(0.55f, 0.55f, 0.55f);
    private static readonly Color ColorText        = Color.white;

    void Awake()
    {
        BuildEventSystem();
        var canvas = BuildCanvas();
        BuildBackground(canvas);
        BuildTitle(canvas);
        BuildGrid(canvas);
    }

    // ── EventSystem ──────────────────────────────────────────────────────────

    private void BuildEventSystem()
    {
        if (FindObjectOfType<EventSystem>() != null) return;

        var es = new GameObject("EventSystem");
        es.AddComponent<EventSystem>();
        es.AddComponent<StandaloneInputModule>();
    }

    // ── Canvas ───────────────────────────────────────────────────────────────

    private GameObject BuildCanvas()
    {
        var go = new GameObject("Canvas");
        var canvas = go.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 0;

        var scaler = go.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080, 1920);
        scaler.matchWidthOrHeight = 0.5f;

        go.AddComponent<GraphicRaycaster>();
        return go;
    }

    // ── Background ───────────────────────────────────────────────────────────

    private void BuildBackground(GameObject canvas)
    {
        var go = new GameObject("Background");
        go.transform.SetParent(canvas.transform, false);

        var img = go.AddComponent<Image>();
        img.color = new Color(0.13f, 0.18f, 0.35f); // dark blue
        img.raycastTarget = false;

        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }

    // ── Title ────────────────────────────────────────────────────────────────

    private void BuildTitle(GameObject canvas)
    {
        var go = new GameObject("Title");
        go.transform.SetParent(canvas.transform, false);

        var txt = go.AddComponent<TextMeshProUGUI>();
        txt.text = "מפת המסע";
        txt.fontSize = 96;
        txt.fontStyle = FontStyles.Bold;
        txt.color = Color.white;
        txt.alignment = TextAlignmentOptions.Center;
        txt.raycastTarget = false;

        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0f, 0.82f);
        rt.anchorMax = new Vector2(1f, 0.97f);
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }

    // ── Level Grid ───────────────────────────────────────────────────────────

    private void BuildGrid(GameObject canvas)
    {
        // Container that covers the lower 80% of screen
        var container = new GameObject("LevelGrid");
        container.transform.SetParent(canvas.transform, false);

        var containerRT = container.AddComponent<RectTransform>();
        containerRT.anchorMin = new Vector2(0.05f, 0.05f);
        containerRT.anchorMax = new Vector2(0.95f, 0.80f);
        containerRT.offsetMin = Vector2.zero;
        containerRT.offsetMax = Vector2.zero;

        int rows = Mathf.CeilToInt((float)TotalLevels / Columns);
        float colW = 1f / Columns;
        float rowH = 1f / rows;
        float padX = 0.04f;
        float padY = 0.04f;

        for (int i = 0; i < TotalLevels; i++)
        {
            int level = i + 1;
            int col = i % Columns;
            int row = rows - 1 - (i / Columns); // bottom-up so level 1 is at bottom-left

            bool isAddition = level <= AdditionLevels;
            bool isUnlocked = level == 1; // only level 1 starts unlocked

            float xMin = col * colW + padX;
            float xMax = (col + 1) * colW - padX;
            float yMin = row * rowH + padY;
            float yMax = (row + 1) * rowH - padY;

            BuildLevelButton(container, level, isAddition, isUnlocked, xMin, xMax, yMin, yMax);
        }
    }

    private void BuildLevelButton(
        GameObject parent,
        int level,
        bool isAddition,
        bool isUnlocked,
        float xMin, float xMax, float yMin, float yMax)
    {
        var go = new GameObject("Level_" + level);
        go.transform.SetParent(parent.transform, false);

        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(xMin, yMin);
        rt.anchorMax = new Vector2(xMax, yMax);
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;

        // Background image — must be on the same GO as Button for targetGraphic
        var img = go.AddComponent<Image>();
        img.color = isUnlocked
            ? (isAddition ? ColorAddition : ColorSubtraction)
            : ColorLocked;
        img.raycastTarget = true;

        // Button
        var btn = go.AddComponent<Button>();
        btn.targetGraphic = img;
        btn.transition = Selectable.Transition.ColorTint;

        if (!isUnlocked)
            btn.interactable = false;

        // Label child
        var labelGO = new GameObject("Label");
        labelGO.transform.SetParent(go.transform, false);

        var labelRT = labelGO.AddComponent<RectTransform>();
        labelRT.anchorMin = Vector2.zero;
        labelRT.anchorMax = Vector2.one;
        labelRT.offsetMin = Vector2.zero;
        labelRT.offsetMax = Vector2.zero;

        var txt = labelGO.AddComponent<TextMeshProUGUI>();
        txt.raycastTarget = false;

        string op = isAddition ? "+" : "-";
        txt.text = isUnlocked
            ? $"שלב {level}\n({op})"
            : $"🔒\nשלב {level}";
        txt.fontSize = 52;
        txt.fontStyle = FontStyles.Bold;
        txt.color = ColorText;
        txt.alignment = TextAlignmentOptions.Center;

        // Wire click — capture loop variable
        int capturedLevel = level;
        btn.onClick.AddListener(() => OnLevelClicked(capturedLevel));
    }

    // ── Click Handler ─────────────────────────────────────────────────────────

    private void OnLevelClicked(int level)
    {
        Debug.Log($"[MapScreen] Level {level} clicked!");
        // TODO: load GameScene for this level
    }
}
