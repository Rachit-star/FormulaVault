'use client'

import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import styles from './LandingPage.module.css'

const FEATURES = [
  { icon: '01', title: 'Hierarchical Vault', desc: 'Organise your formulas in custom exam directories and subfolders.' },
  { icon: '02', title: 'LaTeX Live Compiler', desc: 'Type LaTeX math with instant side-by-side rendering feedback.' },
  { icon: '03', title: 'Spaced-Repetition Arena', desc: 'Drill formulas with interactive flashcards and confidence tracking.' },
]

const PREVIEW_FORMULAS = [
  { title: "Bayes' Theorem", latex: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}', desc: 'Calculates conditional probability of event A given B.', tag: 'PROBABILITY' },
  { title: 'Black-Scholes PDE', latex: '\\frac{\\partial V}{\\partial t} + \\frac{1}{2}\\sigma^2 S^2 \\frac{\\partial^2 V}{\\partial S^2} + r S \\frac{\\partial V}{\\partial S} - rV = 0', desc: 'Governs the price evolution of financial derivatives.', tag: 'FINANCE' },
  { title: 'Normal Distribution', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}', desc: 'Probability density function of Gaussian distributions.', tag: 'STATISTICS' },
]

export default function LandingPage() {
  const supabase = createClient()

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className={styles.main}>
      <div className={styles.splitLayout}>
        {/* Left Side: Product Branding & Actions */}
        <div className={styles.heroColumn}>
          <div className={styles.brandWrapper}>
            <span className={styles.brandGlyph}>⨫</span>
            <span className={styles.brandText}>FormulaForge</span>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.badge}>Quant Preparation Hub</div>
            <h1 className={styles.title}>
              The Knowledge Base for <br />
              <span className={styles.whiteText}>Quantitative Exams</span>
            </h1>
            <p className={styles.subtitle}>
              Store, organize, and drill mathematical formulas. Built for quantitative finance prep, actuarial science, and advanced engineering tests.
            </p>

            <div className={styles.authWrapper}>
              <button className={styles.loginBtn} onClick={handleLogin}>
                <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>

          {/* Minimal Feature List */}
          <div className={styles.featuresList}>
            {FEATURES.map((feat, idx) => (
              <div key={idx} className={styles.featureItem}>
                <span className={styles.featureIcon}>{feat.icon}</span>
                <div>
                  <h4 className={styles.featureTitle}>{feat.title}</h4>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Product Interface Preview */}
        <div className={styles.previewColumn}>
          <div className={styles.mockWindow}>
            <div className={styles.mockHeader}>
              <div className={styles.mockDots}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.mockPath}>Vault / Probability & Finance</span>
            </div>

            <div className={styles.mockContent}>
              {PREVIEW_FORMULAS.map((item, idx) => (
                <div key={idx} className={styles.previewCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTag}>{item.tag}</span>
                    <span className={styles.cardTitle}>{item.title}</span>
                  </div>
                  <div className={styles.cardMath}>
                    <BlockMath math={item.latex} />
                  </div>
                  <span className={styles.cardDesc}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}