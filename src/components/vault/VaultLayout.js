'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import FormulaPanel from './FormulaPanel'
import TopBar from './TopBar'
import styles from './VaultLayout.module.css'

export default function VaultLayout({ user, folders }) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [allFolders, setAllFolders] = useState(folders)

  return (
    <div className={styles.layout}>
      <TopBar user={user} />
      <div className={styles.body}>
        <Sidebar
          folders={allFolders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onFoldersChange={setAllFolders}
          userId={user.id}
        />
        <FormulaPanel
          selectedFolder={selectedFolder}
          userId={user.id}
          allFolders={allFolders}
        />
      </div>
    </div>
  )
}