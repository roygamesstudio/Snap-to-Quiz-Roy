import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function QuizMode({ questions, isPremiumUser, onQuizComplete }) {
  const { theme } = useTheme();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="brain-outline" size={40} color={theme.textMuted} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No quiz questions were generated. Try a different image.
        </Text>
      </View>
    );
  }

  const q = questions[current];
  const isLast = current === questions.length - 1;

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === q.correctAnswerIndex;
    if (correct) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { questionIdx: current, selected: idx, correct }]);
  }

  function next() {
    if (isLast) {
      onQuizComplete?.({
        score,
        total: questions.length,
        weakSpots: answers
          .filter((a) => !a.correct)
          .map((a) => questions[a.questionIdx].question),
      });
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setAnswered(false);
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <ScrollView contentContainerStyle={styles.finishedContainer}>
        <View style={[styles.trophyCircle, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="trophy" size={36} color={theme.warning} />
        </View>
        <Text style={[styles.finishedTitle, { color: theme.text }]}>Quiz Complete!</Text>
        <Text style={[styles.scoreText, { color: theme.textSecondary }]}>
          You scored{' '}
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{score}</Text> out of{' '}
          <Text style={{ fontWeight: '700' }}>{questions.length}</Text>
        </Text>
        <Text style={[styles.percentage, { color: theme.text }]}>{percentage}%</Text>

        {isPremiumUser && (
          <View style={[styles.masteryBox, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.masteryTitle, { color: theme.primary }]}>Mastery breakdown</Text>
            <Text style={[styles.masteryText, { color: theme.primary }]}>
              {percentage >= 80 ? 'Strong mastery' : percentage >= 60 ? 'Developing mastery' : 'Needs review'}
            </Text>
          </View>
        )}

        <View style={styles.reviewList}>
          {questions.map((question, i) => {
            const ans = answers.find((a) => a.questionIdx === i);
            const correct = ans?.correct;
            return (
              <View
                key={i}
                style={[
                  styles.reviewItem,
                  { backgroundColor: correct ? theme.successLight : theme.errorLight },
                ]}
              >
                <Ionicons
                  name={correct ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={correct ? theme.success : theme.error}
                />
                <Text
                  style={[
                    styles.reviewText,
                    { color: correct ? theme.success : theme.error },
                  ]}
                  numberOfLines={3}
                >
                  {question.question}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={restart}
        >
          <Ionicons name="refresh-outline" size={18} color="#FFF" />
          <Text style={styles.retryText}>Retry Quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.quizContainer}>
      <View style={styles.quizHeader}>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          Question {current + 1} of {questions.length}
        </Text>
        <Text style={[styles.scoreDisplay, { color: theme.primary }]}>Score: {score}</Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${((current + 1) / questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={[styles.questionText, { color: theme.text }]}>{q.question}</Text>

      <View style={styles.optionsList}>
        {q.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === q.correctAnswerIndex;
          let bg = theme.card;
          let border = theme.border;
          if (answered) {
            if (isCorrect) {
              bg = theme.successLight;
              border = theme.success;
            } else if (isSelected) {
              bg = theme.errorLight;
              border = theme.error;
            }
          }
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelect(idx)}
              disabled={answered}
              style={[styles.optionButton, { backgroundColor: bg, borderColor: border }]}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
              {answered && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              )}
              {answered && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color={theme.error} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {answered && (
        <View style={[styles.explanationBox, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.explanationText, { color: theme.text }]}>
            <Text style={{ fontWeight: '700' }}>Explanation: </Text>
            {q.explanation}
          </Text>
        </View>
      )}

      {answered && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={next}
        >
          <Text style={styles.nextText}>{isLast ? 'See Results' : 'Next Question'}</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function FlashcardMode({ flashcards }) {
  const { theme } = useTheme();
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(flashcards || []);

  if (!flashcards || flashcards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="layers-outline" size={40} color={theme.textMuted} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No flashcards were generated. Try a different image.
        </Text>
      </View>
    );
  }

  const card = shuffled[current];

  function goNext() {
    setFlipped(false);
    setTimeout(() => setCurrent((c) => (c + 1) % shuffled.length), 150);
  }

  function goPrev() {
    setFlipped(false);
    setTimeout(() => setCurrent((c) => (c - 1 + shuffled.length) % shuffled.length), 150);
  }

  function shuffleCards() {
    const arr = [...flashcards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
    setCurrent(0);
    setFlipped(false);
  }

  return (
    <View style={styles.flashcardContainer}>
      <View style={styles.flashcardHeader}>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          Card {current + 1} of {shuffled.length}
        </Text>
        <TouchableOpacity onPress={shuffleCards} style={styles.shuffleButton}>
          <Ionicons name="shuffle-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.shuffleText, { color: theme.textSecondary }]}>Shuffle</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setFlipped((f) => !f)}
        style={[
          styles.flashcard,
          { backgroundColor: flipped ? theme.success : theme.primary },
        ]}
      >
        <View style={styles.flashcardInner}>
          <Text style={styles.flashcardLabel}>
            {flipped ? 'ANSWER' : 'QUESTION'}
          </Text>
          <Text style={styles.flashcardText}>{flipped ? card.back : card.front}</Text>
          <Text style={styles.flashcardHint}>
            {flipped ? 'Tap to flip back' : 'Tap to flip'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.flashcardControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={goPrev}
        >
          <Ionicons name="chevron-back" size={18} color={theme.text} />
          <Text style={[styles.controlText, { color: theme.text }]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setFlipped((f) => !f)}
        >
          <Text style={[styles.controlText, { color: theme.text }]}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={goNext}
        >
          <Text style={[styles.controlText, { color: theme.text }]}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function StudyHub({ result, onReset, isPremiumUser, onQuizComplete, stats }) {
  const { theme } = useTheme();
  const [tab, setTab] = useState('quiz');

  if (!result) return null;

  const hasQuiz = result.questions && result.questions.length > 0;
  const hasFlashcards = result.flashcards && result.flashcards.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            onPress={() => setTab('quiz')}
            disabled={!hasQuiz}
            style={[
              styles.tab,
              tab === 'quiz' ? { backgroundColor: theme.card } : null,
            ]}
          >
            <Ionicons name="brain-outline" size={16} color={tab === 'quiz' ? theme.primary : theme.textMuted} />
            <Text
              style={[
                styles.tabText,
                { color: tab === 'quiz' ? theme.primary : theme.textMuted },
              ]}
            >
              Quiz
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('flashcards')}
            disabled={!hasFlashcards}
            style={[
              styles.tab,
              tab === 'flashcards' ? { backgroundColor: theme.card } : null,
            ]}
          >
            <Ionicons name="layers-outline" size={16} color={tab === 'flashcards' ? theme.success : theme.textMuted} />
            <Text
              style={[
                styles.tabText,
                { color: tab === 'flashcards' ? theme.success : theme.textMuted },
              ]}
            >
              Flashcards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'quiz' ? (
          <QuizMode questions={result.questions} isPremiumUser={isPremiumUser} onQuizComplete={onQuizComplete} />
        ) : (
          <FlashcardMode flashcards={result.flashcards} />
        )}
      </View>

      <View style={[styles.statsBar, { borderTopColor: theme.border }]}>
        <Text style={[styles.statsText, { color: theme.textMuted }]}>
          Quizzes: {stats?.completed || 0} · Streak: {stats?.streak || 0}
        </Text>
      </View>

      <View style={[styles.resetBar, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.background }]}
          onPress={onReset}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.text} />
          <Text style={[styles.resetText, { color: theme.text }]}>Scan Another Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabBar: {
    borderBottomWidth: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  quizContainer: {
    paddingBottom: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scoreDisplay: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  explanationBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  nextText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  finishedContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 4,
  },
  percentage: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  masteryBox: {
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  masteryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  masteryText: {
    fontSize: 14,
    marginTop: 4,
  },
  reviewList: {
    gap: 8,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reviewText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  flashcardContainer: {
    paddingBottom: 16,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  flashcard: {
    height: 300,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  flashcardInner: {
    alignItems: 'center',
    gap: 16,
  },
  flashcardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  flashcardText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  flashcardHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  flashcardControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsBar: {
    borderTopWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
  },
  resetBar: {
    borderTopWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
