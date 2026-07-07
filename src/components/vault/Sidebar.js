'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { getDotColor } from '@/lib/constants'
import { getChildren as getChildFolders, getRootExamContext } from '@/lib/folders'
import styles from './Sidebar.module.css'

export default function Sidebar({ folders, selectedFolder, onSelectFolder, onFoldersChange, userId }) {
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderExam, setNewFolderExam] = useState('')
  const [parentId, setParentId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState({})
  
  // Folder editing states
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editName, setEditName] = useState('')
  
  // Dropdown menu state: stores folder.id of active dropdown menu
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const supabase = createClient()
  const rootFolders = folders.filter(f => f.parent_id === null)

  function getChildren(parentId) {
    return getChildFolders(parentId, folders)
  }

  function toggleExpand(id, e) {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleCreate() {
    if (!newFolderName.trim()) return
    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        parent_id: parentId,
        name: newFolderName.trim(),
        exam_context: parentId === null ? newFolderExam.trim() || null : null,
      })
      .select()
      .single()

    if (!error && data) {
      onFoldersChange(prev => [...prev, data])
      if (parentId) {
        setExpanded(prev => ({ ...prev, [parentId]: true }))
      }
      setNewFolderName('')
      setNewFolderExam('')
      setParentId(null)
      setCreating(false)
    }
  }

  async function handleRename(folderId) {
    if (!editName.trim()) return
    const { error } = await supabase
      .from('folders')
      .update({ name: editName.trim() })
      .eq('id', folderId)

    if (!error) {
      onFoldersChange(prev =>
        prev.map(f => (f.id === folderId ? { ...f, name: editName.trim() } : f))
      )
      // Update selected folder name if active
      if (selectedFolder?.id === folderId) {
        onSelectFolder(prev => ({ ...prev, name: editName.trim() }))
      }
      setEditingFolderId(null)
      setEditName('')
    }
  }

  async function deleteFolderTree(folderId, allFoldersList) {
    const children = allFoldersList.filter(f => f.parent_id === folderId)
    for (const child of children) {
      await deleteFolderTree(child.id, allFoldersList)
    }
    // Delete formulas associated with this folder
    await supabase.from('formulas').delete().eq('folder_id', folderId)
    // Delete the folder itself
    await supabase.from('folders').delete().eq('id', folderId)
  }

  async function handleDeleteConfirm(folderId) {
    if (!folderId) return

    // Keep copies for cascading deletes in UI
    const foldersToDeleteIds = []
    function collectIds(fid) {
      foldersToDeleteIds.push(fid)
      folders.filter(f => f.parent_id === fid).forEach(child => collectIds(child.id))
    }
    collectIds(folderId)

    await deleteFolderTree(folderId, folders)

    // Update state
    onFoldersChange(prev => prev.filter(f => !foldersToDeleteIds.includes(f.id)))
    if (selectedFolder && foldersToDeleteIds.includes(selectedFolder.id)) {
      onSelectFolder(null)
    }

    setConfirmDeleteId(null)
    setActiveMenuId(null)
  }

  function startRename(folder, e) {
    e.stopPropagation()
    setEditingFolderId(folder.id)
    setEditName(folder.name)
    setActiveMenuId(null)
  }

  function renderFolder(folder, depth = 0) {
    const children = getChildren(folder.id)
    const isSelected = selectedFolder?.id === folder.id
    const isExpanded = !!expanded[folder.id]
    const examContext = getRootExamContext(folder, folders)
    const dotColor = getDotColor(examContext)
    const hasChildren = children.length > 0
    const isEditing = editingFolderId === folder.id

    return (
      <div key={folder.id} className={styles.folderWrapper}>
        <div
          className={`${depth === 0 ? styles.folderRoot : styles.subfolder} ${
            isSelected ? styles.active : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 12}px` }}
          onClick={() => {
            if (!isEditing) {
              onSelectFolder(folder)
              if (hasChildren) {
                setExpanded(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))
              }
            }
          }}
        >
          {/* Guide Line */}
          {depth > 0 && <div className={styles.subLine} />}

          {/* Caret / Icon */}
          {hasChildren ? (
            <span
              className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
              onClick={e => { e.stopPropagation(); setExpanded(prev => ({ ...prev, [folder.id]: !prev[folder.id] })) }}
            >▸</span>
          ) : <span className={styles.chevronSpacer} />
          }

          {/* Dot for root exam folders */}
          {depth === 0 && <div className={styles.dot} style={{ background: dotColor }} />}

          {/* Name / Edit Input */}
          {isEditing ? (
            <input
              className={styles.renameInput}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename(folder.id)
                if (e.key === 'Escape') setEditingFolderId(null)
              }}
              onClick={e => e.stopPropagation()}
              onBlur={() => handleRename(folder.id)}
              autoFocus
            />
          ) : (
            <span className={styles.folderName}>
              {folder.name}
              {depth === 0 && examContext && (
                <span className={styles.examTag} style={{ borderColor: `${dotColor}40`, color: dotColor }}>
                  {examContext.toUpperCase()}
                </span>
              )}
            </span>
          )}

          {/* Action trigger button */}
          {!isEditing && (
            <div className={styles.folderActions} onClick={e => e.stopPropagation()}>
              <button
                className={styles.menuBtn}
                onClick={() => setActiveMenuId(activeMenuId === folder.id ? null : folder.id)}
              >
                ⋯
              </button>

              {/* Dropdown Menu */}
              {activeMenuId === folder.id && (
                <div className={styles.menuDropdown}>
                  <button className={styles.menuItem} onClick={(e) => startRename(folder, e)}>
                    Rename
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setParentId(folder.id)
                      setCreating(true)
                      setActiveMenuId(null)
                    }}
                  >
                    Add subfolder
                  </button>
                  <button
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={() => {
                      setConfirmDeleteId(folder.id)
                      setActiveMenuId(null)
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline Delete Confirmation */}
        {confirmDeleteId === folder.id && (
          <div className={styles.confirmDeleteRow}>
            <span className={styles.confirmDeleteText}>
              Delete "{folder.name}"{hasChildren ? ' and its contents' : ''}?
            </span>
            <button className={styles.confirmCancelBtn} onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </button>
            <button className={styles.confirmDeleteBtn} onClick={() => handleDeleteConfirm(folder.id)}>
              Delete
            </button>
          </div>
        )}

        {/* Render child subfolders */}
        <AnimatePresence initial={false}>
          {isExpanded && children.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.subfolderContainer}
            >
              {children.map(child => renderFolder(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>Folders</span>
        <button
          className={styles.newFolderBtn}
          onClick={() => {
            setParentId(null)
            setCreating(true)
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
      </div>

      <div className={styles.folderList}>
        {rootFolders.map(f => renderFolder(f, 0))}
        {rootFolders.length === 0 && (
          <div className={styles.empty}>
            <p>No folders created yet.</p>
            <p className={styles.emptySub}>Add an exam context folder to start organizing formulas.</p>
          </div>
        )}
      </div>

      {/* Creation Modal / Inline Panel */}
      {creating && (
        <div className={styles.modalOverlay} onClick={() => setCreating(false)}>
          <div className={styles.createBox} onClick={e => e.stopPropagation()}>
            <h4 className={styles.createTitle}>
              {parentId ? 'Add Subfolder' : 'Create Exam Folder'}
            </h4>
            <input
              className={styles.input}
              placeholder={parentId ? 'e.g. Probability, Calculus' : 'e.g. GATE Quant, JEE Math'}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            {parentId === null && (
              <input
                className={styles.input}
                placeholder="Exam abbreviation (e.g. GATE, CAT, JEE)"
                value={newFolderExam}
                onChange={e => setNewFolderExam(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            )}
            <div className={styles.createActions}>
              <button className={styles.confirmBtn} onClick={handleCreate}>
                Create
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setCreating(false)
                  setNewFolderName('')
                  setNewFolderExam('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}