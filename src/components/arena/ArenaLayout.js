'use client'

import { useState } from 'react'
import TopBar from '@/components/vault/TopBar'
import FormulaSelector from './FormulaSelector'
import QuizPanel from './QuizPanel'
import styles from './ArenaLayout.module.css'

export default function ArenaLayout({ user, folders, formulas }) {
  const [selectedFormula, setSelectedFormula] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStartQuiz(formula, examContext, autoMix) {
    setLoading(true)
    setError('')
    setQuizData(null)

    try {
      const res = await fetch('http://localhost:8000/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula_title: formula.title,
          formula_expression: formula.expression,
          formula_topic: formula.title.toLowerCase(),
          exam_context: examContext,
          auto_mix: autoMix,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setQuizData({ ...json.data, formula, examContext })
        setSelectedFormula(formula)
      } else {
        setError('Failed to generate question. Try again.')
      }
    } catch {
      setError('Could not reach the backend. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setQuizData(null)
    setSelectedFormula(null)
  }

  return (
    <div className={styles.layout}>
      <TopBar user={user} allFolders={folders} />
      <div className={styles.body}>
        <div className={styles.left}>
          <FormulaSelector
            folders={folders}
            formulas={formulas}
            onStartQuiz={handleStartQuiz}
            loading={loading}
            selectedFormula={selectedFormula}
          />
        </div>
        <div className={styles.right}>
          {error && <p className={styles.error}>{error}</p>}
          {loading && (
            <div className={styles.loadingState}>
              <p className={styles.loadingText}>Generating question...</p>
            </div>
          )}
          {!loading && !quizData && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Select a formula and start a quiz</p>
            </div>
          )}
          {!loading && quizData && (
            <QuizPanel
              quizData={quizData}
              onReset={handleReset}
              userId={user.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
