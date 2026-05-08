import { useState, useRef } from 'react'
import { X, Download, Upload, FileJson, FileSpreadsheet, Check } from 'lucide-react'
import { useStore } from '../store'
import './ImportExportModal.css'

interface Props {
  projectId?: string
  projectName?: string
  onClose: () => void
}

export default function ImportExportModal({ projectId, projectName, onClose }: Props) {
  const { token, fetchProjects } = useStore()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importPreview, setImportPreview] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = async () => {
    if (!projectId) return

    try {
      const res = await fetch(`/api/export/projects/${projectId}/json`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Export failed')

      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName || 'project'}-export.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  const handleExportCSV = async () => {
    if (!projectId) return

    try {
      const res = await fetch(`/api/export/projects/${projectId}/csv`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Export failed')

      const text = await res.text()
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName || 'project'}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate structure
      if (!data.project || !data.project.name) {
        throw new Error('Invalid file format: missing project name')
      }

      setImportPreview({
        name: data.project.name,
        description: data.project.description,
        nodeCount: data.project.nodes?.length || 0,
        version: data.version,
        source: data.source,
        exportedAt: data.exportedAt
      })
    } catch (e: any) {
      setImportError(e.message || 'Invalid JSON file')
    }
  }

  const handleImport = async () => {
    if (!importPreview) return

    setImporting(true)
    setImportError(null)

    try {
      const file = fileInputRef.current?.files?.[0]
      if (!file) return

      const text = await file.text()
      JSON.parse(text) // Validate JSON

      const res = await fetch('/api/export/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: text
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Import failed')
      }

      await fetchProjects()
      setImportSuccess(true)
      setImportPreview(null)
    } catch (e: any) {
      setImportError(e.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="import-export-overlay" onClick={onClose}>
      <div className="import-export-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 导入 / 导出</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'export' ? 'active' : ''}
            onClick={() => setActiveTab('export')}
          >
            <Download size={16} />
            导出
          </button>
          <button
            className={activeTab === 'import' ? 'active' : ''}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={16} />
            导入
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'export' && (
            <div className="export-section">
              {projectId ? (
                <>
                  <p className="section-desc">导出项目「{projectName}」的数据</p>

                  <div className="export-options">
                    <button className="export-option" onClick={handleExportJSON}>
                      <div className="option-icon">
                        <FileJson size={32} />
                      </div>
                      <div className="option-info">
                        <h4>JSON 格式</h4>
                        <p>完整数据，可用于备份和迁移</p>
                      </div>
                      <Download size={20} className="download-icon" />
                    </button>

                    <button className="export-option" onClick={handleExportCSV}>
                      <div className="option-icon">
                        <FileSpreadsheet size={32} />
                      </div>
                      <div className="option-info">
                        <h4>CSV 格式</h4>
                        <p>表格格式，可用 Excel 打开</p>
                      </div>
                      <Download size={20} className="download-icon" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>请先选择一个项目</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-section">
              <p className="section-desc">从 JSON 文件导入项目</p>

              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Upload size={40} />
                <p>点击选择文件或拖拽到此处</p>
                <span>支持 .json 格式</span>
              </div>

              {importError && (
                <div className="message error">
                  ❌ {importError}
                </div>
              )}

              {importSuccess && (
                <div className="message success">
                  ✅ 项目导入成功！
                </div>
              )}

              {importPreview && (
                <div className="import-preview">
                  <h4>📄 文件预览</h4>
                  <div className="preview-info">
                    <div className="preview-row">
                      <span className="label">项目名称</span>
                      <span className="value">{importPreview.name}</span>
                    </div>
                    {importPreview.description && (
                      <div className="preview-row">
                        <span className="label">描述</span>
                        <span className="value">{importPreview.description}</span>
                      </div>
                    )}
                    <div className="preview-row">
                      <span className="label">节点数量</span>
                      <span className="value">{importPreview.nodeCount} 个</span>
                    </div>
                    {importPreview.source && (
                      <div className="preview-row">
                        <span className="label">来源</span>
                        <span className="value">{importPreview.source}</span>
                      </div>
                    )}
                    {importPreview.exportedAt && (
                      <div className="preview-row">
                        <span className="label">导出时间</span>
                        <span className="value">
                          {new Date(importPreview.exportedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className="import-btn"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? '导入中...' : (
                      <>
                        <Check size={18} />
                        确认导入
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}