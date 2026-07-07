'use client'

import { memo } from 'react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

/**
 * Memoized LaTeX renderer using KaTeX.
 * Wrapped in React.memo because KaTeX rendering is expensive
 * and this component is rendered many times in formula lists.
 */
function LatexRender({ expr }) {
  if (!expr) return null
  try {
    return <BlockMath math={expr} />
  } catch (error) {
    // If KaTeX throws a ParseError, fallback to plain text with a subtle error style
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--danger)', padding: '8px' }}>
        Error: {expr}
      </div>
    )
  }
}

export default memo(LatexRender)
