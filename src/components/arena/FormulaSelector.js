'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDotColor } from '@/lib/constants'
import { getChildren as getChildFolders, getRootExamContext, getFormulasForFolder as getFormulasFor } from '@/lib/folders'
import styles from './FormulaSelector.module.css'

export default function FormulaSelector({ folders, formulas, onStartQuiz, loading, selectedFormula }) {
  const [selectedId, setSelectedId] = useState(null)
  const [examContext, setExamContext] = useState('')
  const [autoMix, setAutoMix] = useState(false)
  const [mode, setMode] = useState('quick')
  const [expandedFolders, setExpandedFolders] = useState({})

  const rootFolders = folders.filter(f => f.parent_id === null)

  function getFormulasForFolder(folderId) {
    return getFormulasFor(folderId, formulas)
  }

  function getChildren(parentId) {
    return getChildFolders(parentId, folders)
  }

  function handleSelectFormula(formula, folder) {
    setSelectedId(formula.id)
    const exam = getRootExamContext(folder, folders)
    if (exam) setExamContext(exam)
  }

  function handleStart() {
    const formula = formulas.find(f => f.id === selectedId)
    if (!formula) return
    onStartQuiz(formula, examContext || 'CAT', autoMix, mode)
  }

  function renderFolder(folder, depth = 0) {
    const children = getChildren(folder.id)
    const folderFormulas = getFormulasForFolder(folder.id)
    const isExpanded = !!expandedFolders[folder.id]
    const hasContent = children.length > 0 || folderFormulas.length > 0
    const examCtx = getRootExamContext(folder, folders)
    const dotColor = getDotColor(examCtx)

    return (
      <div key={folder.id} className={styles.folderWrapper}>
        <div
          className={`${depth === 0 ? styles.folderRoot : styles.subfolder}`}
          style={{ paddingLeft: `${16 + depth * 12}px` }}
          onClick={() => hasContent && setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))}
        >
          {/* Guide Line */}
          {depth > 0 && <div className={styles.subLine} />}

          {/* Caret / Icon */}
          {hasContent ? (
            <span
              className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
              onClick={e => { e.stopPropagation(); setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] })) }}
            >▸</span>
          ) : <span className={styles.chevronSpacer} />
          }

          {/* Dot for root exam folders */}
          {depth === 0 && <div className={styles.dot} style={{ background: dotColor }} />}

          <span className={styles.folderName}>
            {folder.name}
            {depth === 0 && examCtx && (
              <span className={styles.examTag} style={{ borderColor: `${dotColor}40`, color: dotColor }}>
                {examCtx.toUpperCase()}
              </span>
            )}
          </span>
        </div>

        {/* Render child subfolders and formulas */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.subfolderContainer}
            >
              {folderFormulas.map(f => (
                <div
                  key={f.id}
                  className={`${styles.formulaRow} ${selectedId === f.id ? styles.selected : ''}`}
                  style={{ paddingLeft: `${16 + (depth + 1) * 12}px` }}
                  onClick={() => handleSelectFormula(f, folder)}
                >
                  <div className={styles.subLine} />
                  <div className={styles.formulaIconTiny}>
                    <span className={styles.chevronSpacer} />
                  </div>
                  <span className={styles.formulaTitle}>{f.title}</span>
                </div>
              ))}
              {children.map(child => renderFolder(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const selected = formulas.find(f => f.id === selectedId)

  return (
    <div className={styles.selector}>
      <div className={styles.header}>
        <span className={styles.title}>Select Formula</span>
      </div>

      <div className={styles.folderList}>
        {rootFolders.map(f => renderFolder(f))}
        {rootFolders.length === 0 && (
          <p className={styles.empty}>No formulas in vault yet.</p>
        )}
      </div>

      {selected && (
        <div className={styles.controls}>
          <div className={styles.selectedLabel}>
            <span className={styles.selectedName}>{selected.title}</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Mode</label>
            <div className={styles.modeRow}>
              <button
                className={`${styles.modeBtn} ${mode === 'quick' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('quick')}
              >Quick Quiz</button>
              <button
                className={`${styles.modeBtn} ${mode === 'pyq' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('pyq')}
              >PYQ Mode</button>
            </div>
            {mode === 'pyq' && (
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                *Questions are scraped from the web and may not be guaranteed official PYQs.
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Exam context</label>
            <input
              className={styles.input}
              placeholder='CAT, JEE, my college exam...'
              value={examContext}
              onChange={e => setExamContext(e.target.value)}
            />
          </div>

          <label className={styles.mixToggle}>
            <input
              type="checkbox"
              checked={autoMix}
              onChange={e => setAutoMix(e.target.checked)}
            />
            Mix with adjacent topic
          </label>

          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate question'}
          </button>
        </div>
      )}
    </div>
  )
}
