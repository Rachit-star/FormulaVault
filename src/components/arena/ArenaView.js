'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import LatexRender from '@/components/shared/LatexRender'
import TopBar from '@/components/shared/TopBar'
import { getFolderFormulasRecursive } from '@/lib/folders'
import styles from './ArenaView.module.css'

export default function ArenaView({ user, folders, initialFormulas }) {
  const [formulas, setFormulas] = useState(initialFormulas)
  const [selectedFolders, setSelectedFolders] = useState([])
  const [selectedConfidences, setSelectedConfidences] = useState(['fresh', 'shaky', 'solid'])
  const [randomize, setRandomize] = useState(true)
  
  // App modes: 'setup', 'drilling', 'summary'
  const [mode, setMode] = useState('setup')
  const [activeDeck, setActiveDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionRatings, setSessionRatings] = useState([]) // Array of { id, title, rating }

  const supabase = createClient()

  // getFolderFormulasRecursive imported from @/lib/folders

  // Handle building the deck
  function handleStartDrill() {
    let deck = []

    if (selectedFolders.length === 0) {
      // If none selected, drill all that match confidence
      deck = formulas.filter(f => selectedConfidences.includes(f.confidence))
    } else {
      // Collect formulas from selected folders recursively
      let collectedFormulas = []
      selectedFolders.forEach(folderId => {
        const folderFormulas = getFolderFormulasRecursive(folderId, folders, formulas)
        collectedFormulas = [...collectedFormulas, ...folderFormulas]
      })
      
      // Deduplicate formulas by ID
      const uniqueFormulas = Array.from(new Map(collectedFormulas.map(f => [f.id, f])).values())
      deck = uniqueFormulas.filter(f => selectedConfidences.includes(f.confidence))
    }

    if (deck.length === 0) {
      alert('No formulas match your selection. Please adjust your filters!')
      return
    }

    if (randomize) {
      deck = [...deck].sort(() => Math.random() - 0.5)
    }

    setActiveDeck(deck)
    setCurrentIndex(0)
    setIsFlipped(false)
    setSessionRatings([])
    setMode('drilling')
  }

  // Handle rating a formula card
  async function handleRateFormula(rating) {
    const currentFormula = activeDeck[currentIndex]
    
    // Update in Supabase
    const { error } = await supabase
      .from('formulas')
      .update({ confidence: rating })
      .eq('id', currentFormula.id)

    if (!error) {
      // Update local state copy
      setFormulas(prev =>
        prev.map(f => (f.id === currentFormula.id ? { ...f, confidence: rating } : f))
      )
    }

    // Record session results
    setSessionRatings(prev => [
      ...prev,
      { id: currentFormula.id, title: currentFormula.title, rating },
    ])

    // Go to next or end session
    if (currentIndex < activeDeck.length - 1) {
      setIsFlipped(false)
      // Slight timeout for card flip transition to reset before moving to next formula text
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 300)
    } else {
      setMode('summary')
    }
  }

  // Toggles folder checkbox selection
  function handleToggleFolder(folderId) {
    setSelectedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  // Toggles confidence checklist
  function handleToggleConfidence(level) {
    setSelectedConfidences(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  function getFolderBreadcrumb(folderId) {
    const current = folders.find(f => f.id === folderId)
    if (!current) return ''
    const parts = [current.name]
    let parent = folders.find(f => f.id === current.parent_id)
    while (parent) {
      parts.unshift(parent.name)
      parent = folders.find(f => f.id === parent.parent_id)
    }
    return parts.join(' → ')
  }

  // Calculations for summary stats
  const solidCount = sessionRatings.filter(r => r.rating === 'solid').length
  const shakyCount = sessionRatings.filter(r => r.rating === 'shaky').length

  // Quick statistics for current selection
  let previewCount = 0
  if (selectedFolders.length === 0) {
    previewCount = formulas.filter(f => selectedConfidences.includes(f.confidence)).length
  } else {
    let collectedFormulas = []
    selectedFolders.forEach(folderId => {
      collectedFormulas = [...collectedFormulas, ...getFolderFormulasRecursive(folderId, folders, formulas)]
    })
    const uniqueFormulas = Array.from(new Map(collectedFormulas.map(f => [f.id, f])).values())
    previewCount = uniqueFormulas.filter(f => selectedConfidences.includes(f.confidence)).length
  }

  return (
    <div className={styles.layout}>
      <TopBar user={user} />
      <main className={styles.container}>
        <AnimatePresence mode="wait">
          
          {/* SETUP MODE */}
          {mode === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={styles.setupCard}
            >
              <div className={styles.setupHeader}>
                <span className={styles.badge}>Drill Engine</span>
                <h2>Prepare Drilling Session</h2>
                <p className={styles.subtitle}>
                  Configure cards, select subjects/exams, and test your quantitative recalls.
                </p>
              </div>

              {formulas.length === 0 ? (
                <div className={styles.emptyOnboarding}>
                  <p>Your formula vault is empty.</p>
                  <p className={styles.emptySub}>
                    Please head over to the Vault tab, create folders, and add your study equations first.
                  </p>
                </div>
              ) : (
                <div className={styles.setupGrid}>
                  {/* Left Column: Folders select */}
                  <div className={styles.setupCol}>
                    <h4 className={styles.setupSectionTitle}>1. Select Subject Folders</h4>
                    <div className={styles.foldersSelectBox}>
                      <div
                        className={`${styles.folderSelectRow} ${
                          selectedFolders.length === 0 ? styles.activeSelectRow : ''
                        }`}
                        onClick={() => setSelectedFolders([])}
                      >
                        <span className={styles.checkboxSquare}>
                          {selectedFolders.length === 0 && 'x'}
                        </span>
                        <div>
                          <span className={styles.folderRowName}>Drill All Folders</span>
                          <span className={styles.folderRowSub}>Drill all formulas in your vault</span>
                        </div>
                      </div>

                      {folders
                        .filter(f => f.parent_id === null)
                        .map(rootF => {
                          const childs = folders.filter(c => c.parent_id === rootF.id)
                          const rootHasF = formulas.some(form => form.folder_id === rootF.id)
                          const hasAnyFormulas = formulas.some(
                            form =>
                              form.folder_id === rootF.id ||
                              folders
                                .filter(c => c.parent_id === rootF.id)
                                .some(sub => sub.id === form.folder_id)
                          )

                          if (!hasAnyFormulas) return null

                          return (
                            <div key={rootF.id} className={styles.folderGroupWrapper}>
                              <div
                                className={`${styles.folderSelectRow} ${
                                  selectedFolders.includes(rootF.id) ? styles.activeSelectRow : ''
                                }`}
                                onClick={() => handleToggleFolder(rootF.id)}
                              >
                                <span className={styles.checkboxSquare}>
                                  {selectedFolders.includes(rootF.id) && 'x'}
                                </span>
                                <div>
                                  <span className={styles.folderRowName}>{rootF.name}</span>
                                  {rootF.exam_context && (
                                    <span className={styles.examContextBadge}>
                                      {rootF.exam_context.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {childs.map(subF => {
                                const subHasF = formulas.some(form => form.folder_id === subF.id)
                                if (!subHasF) return null
                                return (
                                  <div
                                    key={subF.id}
                                    className={`${styles.folderSelectRow} ${styles.subFolderSelectRow} ${
                                      selectedFolders.includes(subF.id) ? styles.activeSelectRow : ''
                                    }`}
                                    onClick={() => handleToggleFolder(subF.id)}
                                  >
                                    <span className={styles.checkboxSquare}>
                                      {selectedFolders.includes(subF.id) && 'x'}
                                    </span>
                                    <span className={styles.folderRowName}>{subF.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Right Column: Settings */}
                  <div className={styles.setupCol}>
                    <h4 className={styles.setupSectionTitle}>2. Confidence Levels</h4>
                    <div className={styles.settingsGroup}>
                      {['fresh', 'shaky', 'solid'].map(level => (
                        <div
                          key={level}
                          className={`${styles.settingCheckbox} ${
                            selectedConfidences.includes(level) ? styles.activeSetting : ''
                          }`}
                          onClick={() => handleToggleConfidence(level)}
                        >
                          <span className={styles.checkboxSquare}>
                            {selectedConfidences.includes(level) && 'x'}
                          </span>
                          <span className={styles.settingLabel}>
                            {level === 'solid' ? 'Solid' : level === 'shaky' ? 'Shaky' : 'Fresh'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h4 className={styles.setupSectionTitle} style={{ marginTop: '24px' }}>
                      3. Order
                    </h4>
                    <div className={styles.settingsGroup}>
                      <div
                        className={`${styles.settingCheckbox} ${randomize ? styles.activeSetting : ''}`}
                        onClick={() => setRandomize(true)}
                      >
                        <span className={styles.radioCircle}>{randomize && <span />}</span>
                        <span className={styles.settingLabel}>Shuffle Cards</span>
                      </div>
                      <div
                        className={`${styles.settingCheckbox} ${!randomize ? styles.activeSetting : ''}`}
                        onClick={() => setRandomize(false)}
                      >
                        <span className={styles.radioCircle}>{!randomize && <span />}</span>
                        <span className={styles.settingLabel}>Sequential Order</span>
                      </div>
                    </div>

                    <div className={styles.startSection}>
                      <div className={styles.deckStats}>
                        <span className={styles.statsLabel}>Total cards selected:</span>
                        <span className={styles.statsCount}>{previewCount}</span>
                      </div>
                      <button
                        className={styles.startBtn}
                        onClick={handleStartDrill}
                        disabled={previewCount === 0}
                      >
                        Start Session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* DRILLING MODE */}
          {mode === 'drilling' && activeDeck.length > 0 && (
            <motion.div
              key="drilling"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={styles.drillingArea}
            >
              {/* Session Header */}
              <div className={styles.sessionHeader}>
                <button className={styles.exitBtn} onClick={() => setMode('setup')}>
                  Exit Session
                </button>
                <div className={styles.progressSection}>
                  <span className={styles.progressText}>
                    Formula {currentIndex + 1} of {activeDeck.length}
                  </span>
                  <div className={styles.progressBarBg}>
                    <motion.div
                      className={styles.progressBarFill}
                      animate={{ width: `${((currentIndex + 1) / activeDeck.length) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              </div>

              {/* 3D Card Container */}
              <div className={styles.cardViewport}>
                <div
                  className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* FRONT SIDE */}
                  <div className={styles.cardFront}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardPath}>
                        {getFolderBreadcrumb(activeDeck[currentIndex].folder_id)}
                      </span>
                      <span
                        className={`${styles.badge} ${
                          activeDeck[currentIndex].confidence === 'solid'
                            ? styles.solidBadge
                            : activeDeck[currentIndex].confidence === 'shaky'
                            ? styles.shakyBadge
                            : styles.freshBadge
                        }`}
                      >
                        {activeDeck[currentIndex].confidence}
                      </span>
                    </div>

                    <div className={styles.cardMain}>
                      <h2 className={styles.cardTitle}>{activeDeck[currentIndex].title}</h2>
                      {activeDeck[currentIndex].description ? (
                        <p className={styles.cardDesc}>{activeDeck[currentIndex].description}</p>
                      ) : (
                        <p className={styles.cardDescMuted}>No notes added to this formula.</p>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.flipTip}>Click card or spacebar to reveal formula</span>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className={styles.cardBack}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardPath}>
                        {getFolderBreadcrumb(activeDeck[currentIndex].folder_id)}
                      </span>
                      <span className={styles.cardTitleTiny}>{activeDeck[currentIndex].title}</span>
                    </div>

                    <div className={styles.cardMain}>
                      <div className={styles.compiledMathBack} onClick={e => e.stopPropagation()}>
                        <LatexRender expr={activeDeck[currentIndex].expression} />
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.flipTip}>Click card to flip back</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.drillingActions}>
                {isFlipped ? (
                  <div className={styles.ratingRow}>
                    <button
                      className={`${styles.rateBtn} ${styles.rateShaky}`}
                      onClick={() => handleRateFormula('shaky')}
                    >
                      Shaky
                    </button>
                    <button
                      className={`${styles.rateBtn} ${styles.rateSolid}`}
                      onClick={() => handleRateFormula('solid')}
                    >
                      Solid
                    </button>
                  </div>
                ) : (
                  <button className={styles.revealBtn} onClick={() => setIsFlipped(true)}>
                    Reveal Formula
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* SUMMARY MODE */}
          {mode === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={styles.setupCard}
            >
              <div className={styles.setupHeader} style={{ textAlign: 'center' }}>
                <span className={styles.badge} style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  Session Complete!
                </span>
                <h2>Drill Summary</h2>
                <p className={styles.subtitle}>
                  Excellent job finishing your drilling cards. Here is how you rated your recall:
                </p>
              </div>

              {/* Progress Summary Layout */}
              <div className={styles.summaryStatsGrid}>
                <div className={styles.summaryStatItem}>
                  <span className={styles.summaryStatValue}>{activeDeck.length}</span>
                  <span className={styles.summaryStatLabel}>Cards Drilled</span>
                </div>
                <div className={`${styles.summaryStatItem} ${styles.solid}`}>
                  <span className={styles.summaryStatValue}>{solidCount}</span>
                  <span className={styles.summaryStatLabel}>Rated Solid</span>
                </div>
                <div className={`${styles.summaryStatItem} ${styles.shaky}`}>
                  <span className={styles.summaryStatValue}>{shakyCount}</span>
                  <span className={styles.summaryStatLabel}>Rated Shaky</span>
                </div>
              </div>

              {/* Ratings List */}
              <div className={styles.summaryListSection}>
                <h4 className={styles.setupSectionTitle}>Card Log</h4>
                <div className={styles.ratingsList}>
                  {sessionRatings.map((rating, idx) => (
                    <div key={idx} className={styles.ratingsRow}>
                      <span className={styles.ratingsTitle}>{rating.title}</span>
                      <span
                        className={`${styles.badge} ${
                          rating.rating === 'solid' ? styles.solidBadge : styles.shakyBadge
                        }`}
                      >
                        {rating.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className={styles.summaryActions}>
                <button className={styles.cancelBtn} onClick={() => setMode('setup')}>
                  Build New Deck
                </button>
                <button className={styles.confirmBtn} onClick={handleStartDrill}>
                  Drill Again
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
