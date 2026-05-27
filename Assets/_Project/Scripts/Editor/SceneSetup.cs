#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

public static class SceneSetup
{
    [MenuItem("DanDan/Setup Game Scene")]
    public static void SetupGameScene()
    {
        // Empty scene — MapScreen.Awake() builds everything (camera, lights, world)
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        var go = new GameObject("MapScreen");
        go.AddComponent<MapScreen>();

        System.IO.Directory.CreateDirectory("Assets/_Project/Scenes");
        EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/GameScene.unity");
        AssetDatabase.Refresh();

        Debug.Log("[SceneSetup] 3D GameScene created. Press Play to test.");
    }
}
#endif
