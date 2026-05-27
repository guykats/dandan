using UnityEngine;

public class GameManager : Singleton<GameManager>
{
    public int currentStreak = 0;
    public int totalQuestionsInSession = 0;
    public int correctAnswersInSession = 0;
    public bool isSuperMode = false;
    public float successThreshold = 0.8f;
    public bool isInReviewLoop = false;

    public int currentLevel = 1;

    public void RegisterAnswer(bool isCorrect)
    {
        totalQuestionsInSession++;
        if (isCorrect)
        {
            correctAnswersInSession++;
            currentStreak++;
            if (currentStreak >= 5)
                isSuperMode = true;
        }
        else
        {
            currentStreak = 0;
            isSuperMode = false;
        }

        float ratio = totalQuestionsInSession > 0
            ? (float)correctAnswersInSession / totalQuestionsInSession
            : 0f;
        isInReviewLoop = ratio < successThreshold;
    }
}
