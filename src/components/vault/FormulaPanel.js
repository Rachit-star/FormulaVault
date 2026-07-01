'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LatexRender from './LatexRender'
import FormulaModal from './FormulaModal'
import styles from './FormulaPanel.module.css'

function ConfidenceBadge({ level }) {
  const cls = level === 'solid' ? styles.solid : level === 'shaky' ? styles.shaky : styles.fresh
  const label = level === 'solid' ? 'Solid' : level === 'shaky' ? 'Shaky' : 'Fresh'
  return <span className={`${styles.confidence} ${cls}`}>{label}</span>
}

function buildPath(folder, allFolders) {
  const parts = [folder.name]
  let current = folder
  while (current.parent_id) {
    const parent = allFolders.find(f => f.id === current.parent_id)
    if (!parent) break
    parts.unshift(parent.name)
    current = parent
  }
  return parts.join(' / ')
}

export default function FormulaPanel({ selectedFolder, userId, allFolders }) {
  const [formulas, setFormulas] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingFormula, setEditingFormula] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedFolder) return
    setLoading(true)

    function getDescendantIds(folderId) {
      const ids = [folderId]
      const children = (allFolders || []).filter(f => f.parent_id === folderId)
      children.forEach(c => ids.push(...getDescendantIds(c.id)))
      return ids
    }
    const targetIds = getDescendantIds(selectedFolder.id)

    supabase
      .from('formulas')
      .select('*')
      .in('folder_id', targetIds)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setFormulas(data || [])
        setLoading(false)
      })
  }, [selectedFolder?.id])

  function handleSave(formula) {
    setFormulas(prev => {
      const exists = prev.find(f => f.id === formula.id)
      if (exists) return prev.map(f => f.id === formula.id ? formula : f)
      return [...prev, formula]
    })
  }

  function handleDelete(id) {
    setFormulas(prev => prev.filter(f => f.id !== id))
  }

  function openAdd() {
    setEditingFormula(null)
    setShowModal(true)
  }

  function openEdit(formula) {
    setEditingFormula(formula)
    setShowModal(true)
  }

  if (!selectedFolder) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <p className={styles.emptyText}>Select a folder to view formulas</p>
        </div>
      </div>
    )
  }

  const path = buildPath(selectedFolder, allFolders || [])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.path}>{path}</span>
        <button className={styles.addBtn} onClick={openAdd}>
          + Add formula
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>/</span>
          <input
            className={styles.searchInput}
            placeholder="Search formulas..."
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Confidence:</span>
          <button className={`${styles.filterTab} ${styles.activeFilterTab}`}>All</button>
          <button className={styles.filterTab}>Fresh</button>
          <button className={styles.filterTab}>Shaky</button>
          <button className={styles.filterTab}>Solid</button>
        </div>
      </div>

      <div className={styles.formulaList}>
        {loading && (
          <div className={styles.noFormulas}>
            <p className={styles.noFormulasText}>Loading formulas...</p>
          </div>
        )}
        {!loading && formulas.length === 0 && (
          <div className={styles.noFormulas}>
            <div className={styles.emptyIcon}>—</div>
            <p className={styles.noFormulasText}>No formulas yet. Add one to get started.</p>
            <button className={styles.createFirstBtn} onClick={openAdd}>
              + Add First Formula
            </button>
          </div>
        )}
        
        {formulas.length > 0 && (
          <div className={styles.rowsContainer}>
            {formulas.map(f => (
              <div key={f.id} className={styles.formulaRow} onClick={() => openEdit(f)}>
                <div className={styles.formulaHeaderRow}>
                  <div className={styles.formulaTitle}>
                    {f.title}
                    {f.folder_id !== selectedFolder.id && (
                      <span className={styles.subfolderTag}>
                        in {(allFolders || []).find(fl => fl.id === f.folder_id)?.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={styles.formulaDisplay}>
                  <div className={styles.katexMath}>
                    <LatexRender expr={f.expression} />
                  </div>
                </div>
                
                <div className={styles.formulaFooterRow}>
                  <div className={styles.formulaDesc}>{f.description || <em>No description</em>}</div>
                  <ConfidenceBadge level={f.confidence} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <FormulaModal
          folder={selectedFolder}
          userId={userId}
          existingFormula={editingFormula}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}