using System.Collections.Generic;
using UnityEngine;

public struct QuestionData
{
    public string Text;
    public int    CorrectAnswer;
    public int[]  Choices;
}

public class QuestionGenerator : Singleton<QuestionGenerator>
{
    [Range(5, 20)]
    [SerializeField] private int _maxNumber = 10;

    public QuestionData Next()
    {
        int a   = Random.Range(1, _maxNumber + 1);
        int b   = Random.Range(1, _maxNumber + 1);
        bool add = Random.value > 0.4f;

        int    answer;
        string text;

        if (add)
        {
            answer = a + b;
            text   = $"{a} + {b} = ?";
        }
        else
        {
            if (a < b) (a, b) = (b, a);
            answer = a - b;
            text   = $"{a} - {b} = ?";
        }

        return new QuestionData { Text = text, CorrectAnswer = answer, Choices = MakeChoices(answer) };
    }

    private int[] MakeChoices(int correct)
    {
        var used = new HashSet<int> { correct };
        var list = new List<int>   { correct };

        while (list.Count < 4)
        {
            int wrong = Mathf.Max(0, correct + Random.Range(-4, 5));
            if (used.Add(wrong)) list.Add(wrong);
        }

        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = Random.Range(0, i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }

        return list.ToArray();
    }
}
