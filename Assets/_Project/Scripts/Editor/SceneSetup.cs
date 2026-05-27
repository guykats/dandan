using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

public static class SceneSetup
{
    [MenuItem("DanDan/Setup Game Scene")]
    public static void CreateGameScene()
    {
        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // ── Camera ────────────────────────────────────────────────────────────
        var camGO = new GameObject("Main Camera");
        camGO.tag = "MainCamera";
        var cam = camGO.AddComponent<Camera>();
        cam.orthographic     = true;
        cam.orthographicSize = 5f;
        cam.clearFlags       = CameraClearFlags.SolidColor;
        cam.backgroundColor  = new Color(0.08f, 0.12f, 0.25f);

        // ── EventSystem ───────────────────────────────────────────────────────
        var esGO = new GameObject("EventSystem");
        esGO.AddComponent<EventSystem>();
        esGO.AddComponent<StandaloneInputModule>();

        // ── Managers ──────────────────────────────────────────────────────────
        new GameObject("GameManager").AddComponent<GameManager>();
        new GameObject("QuestionGenerator").AddComponent<QuestionGenerator>();

        // ── Canvas ────────────────────────────────────────────────────────────
        var canvasGO = new GameObject("Canvas");
        var canvas   = canvasGO.AddComponent<Canvas>();
        canvas.renderMode  = RenderMode.ScreenSpaceOverlay;
        var scaler = canvasGO.AddComponent<CanvasScaler>();
        scaler.uiScaleMode         = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080, 1920);
        canvasGO.AddComponent<GraphicRaycaster>();

        // Background
        var bg = MakePanel(canvasGO, "Background", new Color(0.08f, 0.12f, 0.25f));
        StretchFull(bg);

        // Stats bar (top)
        var statsBar = MakePanel(canvasGO, "StatsBar", new Color(0f, 0f, 0f, 0.45f));
        Anchor(statsBar, new Vector2(0f, 0.91f), new Vector2(1f, 1f));

        var scoreTMP  = MakeText(statsBar, "ScoreText", "Score: 0", 42);
        AnchorWithOffset(scoreTMP.rectTransform, new Vector2(0f, 0f), new Vector2(0.5f, 1f), new Vector2(28, 6), new Vector2(-6, -6));
        scoreTMP.alignment = TextAlignmentOptions.MidlineLeft;

        var streakTMP = MakeText(statsBar, "StreakText", "Streak: 0", 42);
        AnchorWithOffset(streakTMP.rectTransform, new Vector2(0.5f, 0f), new Vector2(1f, 1f), new Vector2(6, 6), new Vector2(-28, -6));
        streakTMP.alignment = TextAlignmentOptions.MidlineRight;

        // Question panel
        var qPanel = MakePanel(canvasGO, "QuestionPanel", new Color(0.12f, 0.18f, 0.4f, 0.85f));
        Anchor(qPanel, new Vector2(0.04f, 0.63f), new Vector2(0.96f, 0.90f));

        var questionTMP = MakeText(qPanel, "QuestionText", "3 + 4 = ?", 80);
        StretchFull(questionTMP.rectTransform);
        questionTMP.fontStyle = FontStyles.Bold;

        // Super mode banner
        var superGO = MakePanel(canvasGO, "SuperModeBanner", new Color(1f, 0.85f, 0.1f, 0.95f));
        Anchor(superGO, new Vector2(0.05f, 0.60f), new Vector2(0.95f, 0.63f));
        var superTMP = MakeText(superGO, "SuperText", "** SUPER MODE **", 36);
        StretchFull(superTMP.rectTransform);
        superGO.SetActive(false);

        // ── Answer buttons 2x2 ───────────────────────────────────────────────
        Vector2[] bMin = { new(0.04f, 0.37f), new(0.52f, 0.37f), new(0.04f, 0.13f), new(0.52f, 0.13f) };
        Vector2[] bMax = { new(0.48f, 0.58f), new(0.96f, 0.58f), new(0.48f, 0.34f), new(0.96f, 0.34f) };
        Color[]   bCol =
        {
            new(0.18f, 0.56f, 0.90f),
            new(0.18f, 0.78f, 0.48f),
            new(0.95f, 0.72f, 0.08f),
            new(0.92f, 0.28f, 0.48f)
        };

        // GameUI lives on its own GO (no visual component needed)
        var guiGO  = new GameObject("GameUI");
        guiGO.transform.SetParent(canvasGO.transform, false);
        var gameUI = guiGO.AddComponent<GameUI>();

        var buttons    = new Button[4];
        var answerBtns = new AnswerButton[4];

        for (int i = 0; i < 4; i++)
        {
            var btnGO = new GameObject($"AnswerButton_{i}");
            btnGO.transform.SetParent(canvasGO.transform, false);

            var img   = btnGO.AddComponent<Image>();
            img.color = bCol[i];

            var btn    = btnGO.AddComponent<Button>();
            var clrs   = btn.colors;
            clrs.highlightedColor = bCol[i] * 1.3f;
            clrs.pressedColor     = bCol[i] * 0.7f;
            btn.colors = clrs;

            Anchor(btnGO, bMin[i], bMax[i]);

            var lbl = MakeText(btnGO, "Label", "?", 72);
            StretchFull(lbl.rectTransform);
            lbl.fontStyle = FontStyles.Bold;

            var ab = btnGO.AddComponent<AnswerButton>();

            buttons[i]    = btn;
            answerBtns[i] = ab;
        }

        // ── Wire serialised references ───────────────────────────────────────
        var guiSO = new SerializedObject(gameUI);
        guiSO.FindProperty("_questionText").objectReferenceValue       = questionTMP;
        guiSO.FindProperty("_streakText").objectReferenceValue         = streakTMP;
        guiSO.FindProperty("_scoreText").objectReferenceValue          = scoreTMP;
        guiSO.FindProperty("_superModeIndicator").objectReferenceValue = superGO;

        var btnsProp = guiSO.FindProperty("_answerButtons");
        btnsProp.arraySize = 4;
        for (int i = 0; i < 4; i++)
            btnsProp.GetArrayElementAtIndex(i).objectReferenceValue = buttons[i];
        guiSO.ApplyModifiedProperties();

        for (int i = 0; i < 4; i++)
        {
            var abSO = new SerializedObject(answerBtns[i]);
            abSO.FindProperty("_index").intValue                  = i;
            abSO.FindProperty("_gameUI").objectReferenceValue     = gameUI;
            abSO.ApplyModifiedProperties();
        }

        // ── Save scene ───────────────────────────────────────────────────────
        const string scenePath = "Assets/_Project/Scenes/GameScene.unity";
        EditorSceneManager.SaveScene(
            UnityEngine.SceneManagement.SceneManager.GetActiveScene(), scenePath);
        AssetDatabase.Refresh();

        EditorBuildSettings.scenes = new[]
        {
            new EditorBuildSettingsScene(scenePath, true)
        };

        Debug.Log("[DanDan] Scene created → " + scenePath);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static GameObject MakePanel(GameObject parent, string name, Color color)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        go.AddComponent<Image>().color = color;
        return go;
    }

    private static TextMeshProUGUI MakeText(GameObject parent, string name, string text, float size)
    {
        var go  = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text      = text;
        tmp.fontSize  = size;
        tmp.color     = Color.white;
        tmp.alignment = TextAlignmentOptions.Center;
        return tmp;
    }

    private static void StretchFull(GameObject go) =>
        StretchFull(go.GetComponent<RectTransform>());

    private static void StretchFull(RectTransform rt)
    {
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }

    private static void Anchor(GameObject go, Vector2 min, Vector2 max)
    {
        var rt       = go.GetComponent<RectTransform>();
        rt.anchorMin = min;
        rt.anchorMax = max;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }

    private static void AnchorWithOffset(RectTransform rt,
        Vector2 ancMin, Vector2 ancMax, Vector2 offMin, Vector2 offMax)
    {
        rt.anchorMin = ancMin;
        rt.anchorMax = ancMax;
        rt.offsetMin = offMin;
        rt.offsetMax = offMax;
    }
}
