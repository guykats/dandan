using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class GameUI : MonoBehaviour
{
    private TMP_Text   _questionText;
    private Button[]   _answerButtons;
    private TMP_Text   _streakText;
    private TMP_Text   _scoreText;
    private GameObject _superModeIndicator;

    private int _score;
    private int _correct;

    private void Awake()
    {
        var c = transform.parent;
        _questionText       = c.Find("QuestionPanel/QuestionText").GetComponent<TMP_Text>();
        _scoreText          = c.Find("StatsBar/ScoreText").GetComponent<TMP_Text>();
        _streakText         = c.Find("StatsBar/StreakText").GetComponent<TMP_Text>();
        _superModeIndicator = c.Find("SuperModeBanner").gameObject;

        _answerButtons = new Button[4];
        for (int i = 0; i < 4; i++)
            _answerButtons[i] = c.Find("AnswerButton_" + i).GetComponent<Button>();
    }

    private void OnEnable()
    {
        GameManager.OnStreakChanged    += HandleStreak;
        GameManager.OnSuperModeChanged += HandleSuperMode;
    }

    private void OnDisable()
    {
        GameManager.OnStreakChanged    -= HandleStreak;
        GameManager.OnSuperModeChanged -= HandleSuperMode;
    }

    private void Start()
    {
        for (int i = 0; i < _answerButtons.Length; i++)
        {
            int index = i;
            _answerButtons[i].onClick.AddListener(() => OnAnswerClicked(index));
        }
        GameManager.Instance.StartSession();
        _superModeIndicator.SetActive(false);
        ShowNextQuestion();
    }

    public void OnAnswerClicked(int index)
    {
        bool ok = int.Parse(_answerButtons[index].GetComponentInChildren<TMP_Text>().text) == _correct;

        if (ok) _score += GameManager.Instance.IsSuperMode ? 20 : 10;
        _scoreText.text = "Score: " + _score;

        GameManager.Instance.RegisterAnswer(ok);
        StartCoroutine(FlashThenNext(index, ok));
    }

    private IEnumerator FlashThenNext(int index, bool ok)
    {
        var img  = _answerButtons[index].GetComponent<Image>();
        var orig = img.color;
        img.color = ok ? new Color(0.2f, 0.9f, 0.3f) : new Color(0.9f, 0.2f, 0.2f);
        yield return new WaitForSeconds(0.4f);
        img.color = orig;
        ShowNextQuestion();
    }

    private void ShowNextQuestion()
    {
        var q    = QuestionGenerator.Instance.Next();
        _correct = q.CorrectAnswer;
        _questionText.text = q.Text;
        for (int i = 0; i < _answerButtons.Length; i++)
            _answerButtons[i].GetComponentInChildren<TMP_Text>().text = q.Choices[i].ToString();
    }

    private void HandleStreak(int s)      => _streakText.text = s > 0 ? "Streak: " + s + " !" : "Streak: 0";
    private void HandleSuperMode(bool on) => _superModeIndicator.SetActive(on);
}
