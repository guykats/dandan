using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class AnswerButton : MonoBehaviour
{
    [SerializeField] private int     _index;
    [SerializeField] private GameUI  _gameUI;

    private void Start() =>
        GetComponent<Button>().onClick.AddListener(() => _gameUI.OnAnswerClicked(_index));
}
