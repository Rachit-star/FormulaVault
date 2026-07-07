'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LatexRender from '@/components/shared/LatexRender'
import styles from './FormulaModal.module.css'

export default function FormulaModal({ folder, userId, onClose, onSave, onDelete, existingFormula }) {
  const isEdit = !!existingFormula
  const [title, setTitle] = useState(existingFormula?.title || '')
  const [expression, setExpression] = useState(existingFormula?.expression || '')
  const [description, setDescription] = useState(existingFormula?.description || '')
  const [memoryTrick, setMemoryTrick] = useState(existingFormula?.memory_trick || '')
  const [confidence, setConfidence] = useState(existingFormula?.confidence || 'fresh')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSave() {
    if (!title.trim() || !expression.trim()) {
      setError('Title and expression are required.')
      return
    }
    setSaving(true)
    setError('')
    if (isEdit) {
      const { data, error: err } = await supabase
        .from('formulas')
        .update({
          title: title.trim(),
          expression: expression.trim(),
          description: description.trim() || null,
          memory_trick: memoryTrick.trim() || null,
          confidence,
        })
        .eq('id', existingFormula.id)
        .select()
        .single()

      if (err) {
        setError('Failed to update. Try again.')
        setSaving(false)
        return
      }
      onSave(data)
    } else {
      const { data, error: err } = await supabase
        .from('formulas')
        .insert({
          user_id: userId,
          folder_id: folder.id,
          title: title.trim(),
          expression: expression.trim(),
          description: description.trim() || null,
          memory_trick: memoryTrick.trim() || null,
          confidence,
        })
        .select()
        .single()

      if (err) {
        setError('Failed to save. Try again.')
        setSaving(false)
        return
      }
      onSave(data)
    }

    onClose()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error: err } = await supabase
      .from('formulas')
      .delete()
      .eq('id', existingFormula.id)

    if (err) {
      setError('Failed to delete. Try again.')
      setDeleting(false)
      return
    }
    onDelete(existingFormula.id)
    onClose()
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>
            {isEdit ? 'Edit formula' : `Add formula — ${folder.name}`}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              placeholder='e.g. Profit percentage'
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Expression
              <span className={styles.optional}>LaTeX syntax</span>
            </label>
            <input
              className={`${styles.input} ${styles.exprInput}`}
              placeholder='e.g. Profit\% = \frac{SP - CP}{CP} \times 100'
              value={expression}
              onChange={e => setExpression(e.target.value)}
            />
            {expression && (
              <div>
                <p className={styles.previewLabel}>Preview</p>
                <div className={styles.preview}>
                  <LatexRender expr={expression} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Description
              <span className={styles.optional}>optional</span>
            </label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder='Plain English explanation of what this formula does'
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Memory trick
              <span className={styles.optional}>optional</span>
            </label>
            <input
              className={styles.input}
              placeholder='Shortcut, mnemonic, or tip to remember this'
              value={memoryTrick}
              onChange={e => setMemoryTrick(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confidence</label>
            <div className={styles.confidenceRow}>
              {['fresh', 'shaky', 'solid'].map(level => (
                <button
                  key={level}
                  className={`${styles.confOption} ${styles[`conf${level.charAt(0).toUpperCase() + level.slice(1)}`]} ${confidence === level ? styles.selected : ''}`}
                  onClick={() => setConfidence(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          {isEdit && (
            <div className={styles.deleteZone}>
              {!confirmDelete ? (
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
                  Delete
                </button>
              ) : (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmText}>Delete this formula?</span>
                  <button className={styles.confirmYes} onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button className={styles.confirmNo} onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          <div className={styles.saveZone}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Save formula'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}