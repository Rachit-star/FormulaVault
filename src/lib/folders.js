/**
 * Shared folder utility functions used across vault and arena components.
 * Eliminates duplication of buildPath, getChildren, getRootExamContext, etc.
 */

/**
 * Builds a breadcrumb path string for a folder, e.g. "JEE Math / Calculus / Integration"
 */
export function buildPath(folder, allFolders) {
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

/**
 * Returns direct child folders of a given parent folder ID.
 */
export function getChildren(parentId, allFolders) {
  return allFolders.filter(f => f.parent_id === parentId)
}

/**
 * Walks up the folder tree to find the root folder's exam_context.
 */
export function getRootExamContext(folder, allFolders) {
  if (!folder.parent_id) return folder.exam_context
  const parent = allFolders.find(f => f.id === folder.parent_id)
  return parent ? getRootExamContext(parent, allFolders) : null
}

/**
 * Recursively collects all descendant folder IDs (including the given folder itself).
 */
export function getDescendantIds(folderId, allFolders) {
  const ids = [folderId]
  const children = allFolders.filter(f => f.parent_id === folderId)
  children.forEach(c => ids.push(...getDescendantIds(c.id, allFolders)))
  return ids
}

/**
 * Returns formulas that belong to a specific folder (direct children only).
 */
export function getFormulasForFolder(folderId, allFormulas) {
  return allFormulas.filter(f => f.folder_id === folderId)
}

/**
 * Recursively collects all formulas inside a folder and its subfolders.
 */
export function getFolderFormulasRecursive(folderId, allFolders, allFormulas) {
  let result = allFormulas.filter(f => f.folder_id === folderId)
  const childFolders = allFolders.filter(f => f.parent_id === folderId)
  for (const child of childFolders) {
    result = [...result, ...getFolderFormulasRecursive(child.id, allFolders, allFormulas)]
  }
  return result
}
