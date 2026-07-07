'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import styles from './TopBar.module.css'

export default function TopBar({ user }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [randomFormula, setRandomFormula] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleRandomFormula() {
    setLoading(true)
    const { data, error } = await supabase
      .from('formulas')
      .select('*')
      .eq('user_id', user.id)

    if (!error && data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setRandomFormula(data[randomIndex])
      setShowModal(true)
    } else {
      alert("No formulas found in your vault! Create a folder and add formulas first.")
    }
    setLoading(false)
  }

  const initial = user.email?.[0]?.toUpperCase() || 'U'

  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.left}>
          <Link href="/vault" className={styles.logoWrapper}>
            <span className={styles.logoLogo}>⨫</span>
            <span className={styles.logoText}>FormulaForge</span>
          </Link>

          <nav className={styles.nav}>
            <Link
              href="/vault"
              prefetch={true}
              className={`${styles.navLink} ${pathname === '/vault' ? styles.active : ''}`}
            >
              Vault
              {pathname === '/vault' && (
                <motion.div layoutId="nav-pill" className={styles.activePill} />
              )}
            </Link>
            <Link
              href="/arena"
              prefetch={true}
              className={`${styles.navLink} ${pathname === '/arena' ? styles.active : ''}`}
            >
              Arena
              {pathname === '/arena' && (
                <motion.div layoutId="nav-pill" className={styles.activePill} />
              )}
            </Link>
          </nav>
        </div>

        <div className={styles.right}>
          <button
            className={`${styles.randomBtn} ${loading ? styles.loading : ''}`}
            onClick={handleRandomFormula}
            disabled={loading}
          >
            <span className={styles.randomIcon}>↻</span>
            <span>Random Formula</span>
          </button>

          <div className={styles.userSection}>
            <div className={styles.avatar} title={user.email}>
              {initial}
            </div>
            <button className={styles.signOutBtn} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Random Formula Modal overlay */}
      <AnimatePresence>
        {showModal && randomFormula && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={styles.modalContent}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <span className={styles.modalSubtitle}>Daily Inspiration / Drill</span>
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <h3 className={styles.modalTitle}>{randomFormula.title}</h3>

              <div className={styles.mathContainer}>
                <BlockMath math={randomFormula.expression} />
              </div>

              {randomFormula.description && (
                <div className={styles.descSection}>
                  <h4 className={styles.sectionLabel}>Notes</h4>
                  <p className={styles.modalDesc}>{randomFormula.description}</p>
                </div>
              )}

              <div className={styles.footerSection}>
                <div className={styles.confidenceInfo}>
                  <span className={styles.sectionLabel}>Confidence:</span>
                  <span
                    className={`${styles.badge} ${
                      randomFormula.confidence === 'solid'
                        ? styles.solid
                        : randomFormula.confidence === 'shaky'
                        ? styles.shaky
                        : styles.fresh
                    }`}
                  >
                    {randomFormula.confidence}
                  </span>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.secondaryBtn} onClick={handleRandomFormula}>
                    ↻ Another One
                  </button>
                  <button className={styles.primaryBtn} onClick={() => setShowModal(false)}>
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}