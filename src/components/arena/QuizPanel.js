'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './QuizPanel.module.css'

export default function QuizPanel({ quizData, onReset, userId }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [evalData, setEvalData] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const supabase = createClient()

  const options = ['A', 'B', 'C', 'D']

  async function handleSubmit() {
    if (!selected) return
    setEvalLoading(true)

    const userAnswerText = quizData.options[selected]
    const isCorrect = selected === quizData.correct

    try {
      const res = await fetch('/api/arena/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: quizData.question,
          correct_answer: quizData.options[quizData.correct],
          correct_letter: quizData.correct,
          user_answer: `${selected}) ${quizData.options[selected]}`,
          formula: {
            id: quizData.formula.id,
            title: quizData.formula.title,
            expression: quizData.formula.expression,
          },
          exam_context: quizData.examContext,
        }),
      })
      const json = await res.json()
      if (json.success) setEvalData(json.data.eval)
    } catch {
      setEvalData({ verdict: isCorrect ? 'CORRECT' : 'INCORRECT', explanation: 'Could not reach evaluator.', tip: '', better_formula: '' })
    } finally {
      setEvalLoading(false)
      setSubmitted(true)
    }

    await supabase.from('formula_reviews').insert({
      user_id: userId,
      formula_id: quizData.formula.id,
      answered: true,
      got_correct: isCorrect,
      source: 'quiz',
    })

    const newConfidence = isCorrect ? 'solid' : 'shaky'
    await supabase
      .from('formulas')
      .update({ confidence: newConfidence })
      .eq('id', quizData.formula.id)
  }

  const isCorrect = submitted && selected === quizData.correct

  return (
    <div className={styles.panel}>
      <div className={styles.questionSection}>
        <p className={styles.questionLabel}>Question</p>
        <p className={styles.question}>{quizData.question}</p>
        {quizData.source_label && (
          <div className={styles.sourceTag}>
            {quizData.source_label}
            {quizData.source_url && quizData.source !== 'generated' && (
              <a href={quizData.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                View source
              </a>
            )}
          </div>
        )}
      </div>

      <div className={styles.optionsSection}>
        {options.map(letter => {
          const optionText = quizData.options[letter]
          if (!optionText) return null

          let optionClass = styles.option
          if (submitted) {
            if (letter === quizData.correct) optionClass = `${styles.option} ${styles.correct}`
            else if (letter === selected) optionClass = `${styles.option} ${styles.wrong}`
          } else if (selected === letter) {
            optionClass = `${styles.option} ${styles.optionSelected}`
          }

          return (
            <button
              key={letter}
              className={optionClass}
              onClick={() => !submitted && setSelected(letter)}
              disabled={submitted}
            >
              <span className={styles.optionLetter}>{letter}</span>
              <span className={styles.optionText}>{optionText}</span>
            </button>
          )
        })}
      </div>

      {!submitted && (
        <div className={styles.actions}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!selected || evalLoading}
          >
            {evalLoading ? 'Evaluating...' : 'Submit answer'}
          </button>
        </div>
      )}

      {submitted && evalData && (
        <div className={styles.evalSection}>
          <div className={`${styles.verdict} ${isCorrect ? styles.verdictCorrect : styles.verdictWrong}`}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </div>

          {evalData.explanation && (
            <div className={styles.evalBlock}>
              <p className={styles.evalLabel}>Explanation</p>
              <p className={styles.evalText}>{evalData.explanation}</p>
            </div>
          )}

          {evalData.tip && (
            <div className={styles.evalBlock}>
              <p className={styles.evalLabel}>Exam tip</p>
              <p className={styles.evalText}>{evalData.tip}</p>
            </div>
          )}

          {evalData.better_formula && evalData.better_formula !== 'NONE' && (
            <div className={styles.evalBlock}>
              <p className={styles.evalLabel}>Faster approach</p>
              <p className={styles.evalText}>{evalData.better_formula}</p>
            </div>
          )}

          <div className={styles.postActions}>
            <button className={styles.resetBtn} onClick={onReset}>
              Try another formula
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
