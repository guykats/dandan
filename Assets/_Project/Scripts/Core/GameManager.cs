using UnityEngine;
using System;

public class GameManager : Singleton<GameManager>
{
    // ─── Events ──────────────────────────────────────────────────────────────
    public static event Action<bool> OnSuperModeChanged;
    public static event Action<int>  OnStreakChanged;
    public static event Action       OnReviewLoopEntered;
    public static event Action       OnSessionComplete;

    // ─── Game State ──────────────────────────────────────────────────────────
    public enum GameState { MainMenu, Playing, Paused, LevelComplete, GameOver }

    [Header("Game State")]
    [SerializeField] private GameState _currentState = GameState.MainMenu;

    // ─── Streak & Super Mode ─────────────────────────────────────────────────
    [Header("Streak")]
    [SerializeField] private int _streakThreshold = 3;

    private int  _currentStreak;
    private bool _isSuperMode;

    public int  CurrentStreak => _currentStreak;
    public bool IsSuperMode   => _isSuperMode;

    // ─── Adaptive Learning ───────────────────────────────────────────────────
    [Header("Adaptive Learning")]
    [Range(0f, 1f)]
    [SerializeField] private float _successThreshold = 0.8f; // 80%

    private int  _totalQuestions;
    private int  _correctAnswers;
    private bool _isInReviewLoop;

    public float SuccessRate    => _totalQuestions > 0 ? (float)_correctAnswers / _totalQuestions : 0f;
    public bool  IsInReviewLoop => _isInReviewLoop;

    // ─── Lifecycle ───────────────────────────────────────────────────────────
    protected override void Awake()
    {
        base.Awake();
    }

    // ─── Public API ──────────────────────────────────────────────────────────
    public void StartSession()
    {
        _totalQuestions = 0;
        _correctAnswers = 0;
        _currentStreak  = 0;
        _isSuperMode    = false;
        _isInReviewLoop = false;
        ChangeState(GameState.Playing);
    }

    public void RegisterAnswer(bool isCorrect)
    {
        _totalQuestions++;

        if (isCorrect)
        {
            _correctAnswers++;
            _currentStreak++;
            OnStreakChanged?.Invoke(_currentStreak);

            if (_currentStreak >= _streakThreshold && !_isSuperMode)
                SetSuperMode(true);
        }
        else
        {
            _currentStreak = 0;
            OnStreakChanged?.Invoke(_currentStreak);

            if (_isSuperMode)
                SetSuperMode(false);

            EvaluateAdaptiveLoop();
        }
    }

    public void EndSession()
    {
        ChangeState(GameState.LevelComplete);
        OnSessionComplete?.Invoke();
    }

    public void ChangeState(GameState newState)
    {
        _currentState = newState;
        Time.timeScale = (newState == GameState.Paused) ? 0f : 1f;
    }

    public GameState CurrentState => _currentState;

    // ─── Private Helpers ─────────────────────────────────────────────────────
    private void SetSuperMode(bool active)
    {
        _isSuperMode = active;
        OnSuperModeChanged?.Invoke(active);
        // AudioManager.Instance.SetSuperModeMusic(active);
        // UIManager.Instance.ShowSuperModeEffect(active);
    }

    private void EvaluateAdaptiveLoop()
    {
        if (_totalQuestions < 5) return; // מינימום שאלות לפני הערכה

        bool belowThreshold = SuccessRate < _successThreshold;
        if (belowThreshold && !_isInReviewLoop)
        {
            _isInReviewLoop = true;
            OnReviewLoopEntered?.Invoke();
        }
        else if (!belowThreshold && _isInReviewLoop)
        {
            _isInReviewLoop = false;
        }
    }
}
