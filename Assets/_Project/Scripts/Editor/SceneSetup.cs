#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

public static class SceneSetup
{
    [MenuItem("DanDan/Setup Game Scene")]
    public static void SetupGameScene()
    {
        // New empty scene
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // Camera
        var cameraGO = new GameObject("Main Camera");
        var cam = cameraGO.AddComponent<Camera>();
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.13f, 0.18f, 0.35f);
        cam.orthographic = true;
        cameraGO.tag = "MainCamera";

        // MapScreen host — component builds everything at runtime
        var mapGO = new GameObject("MapScreen");
        mapGO.AddComponent<MapScreen>();

        // Save
        System.IO.Directory.CreateDirectory("Assets/_Project/Scenes");
        EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/GameScene.unity");
        AssetDatabase.Refresh();

        Debug.Log("[SceneSetup] GameScene created. Press Play to test.");
    }
}
#endif
