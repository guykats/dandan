#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

public static class SceneSetup
{
    [MenuItem("DanDan/Setup Game Scene")]
    public static void SetupGameScene()
    {
        if (EditorApplication.isPlaying)
        {
            Debug.LogError("[SceneSetup] Stop Play Mode before running Setup Game Scene.");
            return;
        }

        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // Camera
        var camGO = new GameObject("Main Camera");
        var cam   = camGO.AddComponent<Camera>();
        cam.clearFlags      = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.13f, 0.18f, 0.35f);
        cam.orthographic    = true;
        camGO.tag = "MainCamera";

        // MapScreen host — builds all UI at runtime
        var mapGO = new GameObject("MapScreen");
        mapGO.AddComponent<MapScreen>();

        System.IO.Directory.CreateDirectory("Assets/_Project/Scenes");
        EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/GameScene.unity");
        AssetDatabase.Refresh();

        Debug.Log("[SceneSetup] GameScene created. Press Play to test.");
    }
}
#endif
