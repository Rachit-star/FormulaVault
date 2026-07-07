'use client'

import { createClient } from '@/lib/supabase/client'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useEffect, useState } from 'react'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'
import styles from './LandingPage.module.css'

function BentoCard({ className, children, title, text }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div 
      className={`${styles.bentoCard} ${className || ''}`}
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': useMotionTemplate`${mouseX}px`,
        '--mouse-y': useMotionTemplate`${mouseY}px`,
      }}
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardText}>{text}</p>
        <div className={styles.cardVisual}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}

// Vault / Graph Visual (Structured Storage)
function VaultVisual() {
  const folders = [
    { name: 'Physics / Mechanics', items: ['Kinematic Equations', 'Work-Energy Theorem'] },
    { name: 'Math / Calculus', items: ['Taylor Series'] },
  ];

  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', position: 'relative' }}>
      {/* Vertical tree line */}
      <div style={{ position: 'absolute', left: '35px', top: '52px', bottom: '60px', width: '1px', background: 'linear-gradient(to bottom, rgba(235, 208, 156, 0.3), rgba(255,255,255,0.05))', zIndex: 0 }} />

      {folders.map((folder, fIdx) => (
        <motion.div 
          key={fIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fIdx * 0.2, duration: 0.5, ease: "easeOut" }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ 
              width: '24px', height: '24px', 
              borderRadius: '6px', 
              background: 'rgba(235, 208, 156, 0.15)', 
              border: '1px solid rgba(235, 208, 156, 0.3)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(235, 208, 156, 0.1)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ebd09c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.2-1.82A2 2 0 0 0 7.55 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e0e0e0', letterSpacing: '0.02em' }}>{folder.name}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '34px' }}>
            {folder.items.map((item, iIdx) => (
              <motion.div 
                key={iIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 2, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                transition={{ delay: (fIdx * 0.2) + (iIdx * 0.1) + 0.3, duration: 0.4 }}
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '8px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  position: 'relative',
                  cursor: 'default',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                {/* Horizontal branch line */}
                <div style={{ position: 'absolute', left: '-22px', top: '50%', width: '22px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                
                <span style={{ fontSize: '12.5px', color: '#a0a0a0', fontFamily: "'JetBrains Mono', monospace" }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Typing LaTeX Animation
function LatexVisual() {
  const fullCode = "i\\hbar\\frac{\\partial}{\\partial t} \\Psi = \\hat{H}\\Psi"
  const [text, setText] = useState("")

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setText(fullCode.slice(0, i))
      i++
      if (i > fullCode.length) {
        clearInterval(interval)
        setTimeout(() => { i = 0; setInterval(interval) }, 2000)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505' }}>
      <div className={styles.codeBlock}>
        {text}<span style={{opacity: 0.5}}>_</span>
      </div>
      <div className={styles.mathRender}>
        {text.length > 5 ? <BlockMath math={text + (text.length < fullCode.length ? "" : "")} /> : null}
      </div>
    </div>
  )
}

// AI Quiz Generation Visual (The Byproduct)
function QuizVisual() {
  const fullCode = "Reading Vault...\nFound formula: Schrödinger Eq.\nGenerating test question..."
  const [text, setText] = useState("")

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setText(fullCode.slice(0, i))
      i++
      if (i > fullCode.length) {
        clearInterval(interval)
        setTimeout(() => { i = 0; setInterval(interval) }, 3000)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505' }}>
      <div className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap' }}>
        <span style={{ color: '#888' }}>$ generate --from-vault</span><br/><br/>
        {text}<span style={{opacity: 0.5}}>_</span>
      </div>
    </div>
  )
}

// Past Year Questions Visual (PYQ)
function PYQVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
      <div style={{ padding: '8px 16px', background: 'rgba(235, 208, 156, 0.1)', border: '1px solid rgba(235, 208, 156, 0.3)', borderRadius: '4px', color: '#ebd09c', fontSize: '0.85rem' }}>
        JEE Advanced - Physics
      </div>
      <div style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', color: '#888', fontSize: '0.85rem', transform: 'scale(0.95)' }}>
        CAT - Quantitative
      </div>
    </div>
  )
}

export default function LandingPage() {
  const supabase = createClient()

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className={styles.main}>
      
      <motion.div 
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className={styles.title}>FormulaForge</h1>
        <p className={styles.subtitle}>
          Store, organize, and render your formulas.
        </p>
        <button className={styles.loginBtn} onClick={handleLogin}>
          Open Vault
        </button>
      </motion.div>

      <motion.div 
        className={styles.bentoGrid}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
      >
        {/* Core Feature: Storing Formulas */}
        <BentoCard 
          className={styles.span2}
          title="Structured Storage" 
          text="A living database for your theorems."
        >
          <VaultVisual />
        </BentoCard>

        {/* Core Feature: Rendering */}
        <BentoCard 
          title="Live LaTeX" 
          text="Flawless KaTeX rendering."
        >
          <LatexVisual />
        </BentoCard>

        {/* Byproduct Feature: Quizzes */}
        <BentoCard 
          title="Auto-Quizzes" 
          text="Test memory with generated quizzes."
        >
          <QuizVisual />
        </BentoCard>

        {/* Byproduct Feature: Arena */}
        <BentoCard 
          className={styles.span2}
          title="Exam Arena" 
          text="Train on Past Year Questions."
        >
          <PYQVisual />
        </BentoCard>
      </motion.div>

    </main>
  )
}