'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import LatexRender from './LatexRender'
import styles from './RandomFormulaModal.module.css'

function buildPath(folder, allFolders) {
    if (!folder) return ''
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

export default function RandomFormulaModal({ userId, allFolders, onClose }) {
    const [allFormulas, setAllFormulas] = useState([])
    const [current, setCurrent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [count, setCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        supabase
            .from('formulas')
            .select('*')
            .eq('user_id', userId)
            .then(({ data }) => {
                setAllFormulas(data || [])
                setLoading(false)
                if (data && data.length > 0) {
                    pickRandom(data)
                }
            })
    }, [])

    function pickRandom(list) {
        const pool = list || allFormulas
        if (pool.length === 0) return
        const next = pool[Math.floor(Math.random() * pool.length)]
        setCurrent(next)
        setCount(c => c + 1)

        supabase.from('formula_reviews').insert({
            user_id: userId,
            formula_id: next.id,
            answered: false,
            source: 'random',
        }).then(() => { })
    }

    const folder = current ? allFolders.find(f => f.id === current.folder_id) : null
    const path = buildPath(folder, allFolders)

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.card}>
                <div className={styles.topRow}>
                    <span className={styles.path}>{loading ? 'Loading' : path || 'Random formula'}</span>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {loading && <div className={styles.empty}>Loading your vault...</div>}

                {!loading && allFormulas.length === 0 && (
                    <div className={styles.empty}>No formulas in your vault yet. Add some first.</div>
                )}

                {!loading && current && (
                    <div className={styles.center}>
                        <div className={styles.formulaTitle}>{current.title}</div>
                        <div className={styles.expression}>
                            <LatexRender expr={current.expression} />
                        </div>
                        {current.memory_trick && (
                            <div className={styles.trick}>Tip: {current.memory_trick}</div>
                        )}
                    </div>
                )}

                {!loading && allFormulas.length > 0 && (
                    <>
                        <div className={styles.actions}>
                            <button className={styles.againBtn} onClick={() => pickRandom()}>
                                Next
                            </button>
                            <button className={styles.doneBtn} onClick={onClose}>
                                Done
                            </button>
                        </div>
                        <div className={styles.counter}>{count} viewed this session</div>
                    </>
                )}
            </div>
        </div>
    )
}