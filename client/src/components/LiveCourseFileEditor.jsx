import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Save,
  FileDown,
  Search,
  Bold,
  Italic,
  List,
  ListOrdered,
  Table,
  RefreshCw,
  Check,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Sparkles,
  Upload
} from 'lucide-react'
import api, { errMsg } from '../api'
import { Badge, Notice, btn, fmt } from './ui'

export default function LiveCourseFileEditor({ courseId, setError, setInfo }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState({})
  const [savingSection, setSavingSection] = useState({})
  const [savedStatus, setSavedStatus] = useState({})
  const [exporting, setExporting] = useState(false)
  const [generatedFile, setGeneratedFile] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [activeId, setActiveId] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)

  const sectionRefs = useRef({})
  const textareaRefs = useRef({})
  const fileInputs = useRef({})
  const [uploadingSection, setUploadingSection] = useState({})

  const handleSectionUpload = async (sectionId, file) => {
    if (!file) return
    setError('')
    setInfo('')
    setUploadingSection((prev) => ({ ...prev, [sectionId]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('templateSectionId', sectionId)
      const res = await api.post(`/courses/${courseId}/common-info/upload`, fd)
      setInfo(res.data.message || 'Document uploaded and accepted without review.')
      if (res.data.section?.text) {
        setEdits((prev) => ({ ...prev, [sectionId]: res.data.section.text }))
        setData((prev) => {
          if (!prev) return prev
          const updated = prev.sections.map((s) =>
            s.id === sectionId ? { ...s, text: res.data.section.text, status: 'ACCEPTED' } : s
          )
          return { ...prev, sections: updated }
        })
      }
    } catch (err) {
      setError(`Upload failed: ${errMsg(err)}`)
    } finally {
      setUploadingSection((prev) => ({ ...prev, [sectionId]: false }))
      if (fileInputs.current[sectionId]) {
        fileInputs.current[sectionId].value = ''
      }
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/generation/course/${courseId}/editor`)
      setData(res.data)
      if (res.data.latestFile) {
        setGeneratedFile(res.data.latestFile)
      }
      // Initialize edit values from server text
      const initial = {}
      res.data.sections.forEach((s) => {
        initial[s.id] = s.text || ''
      })
      setEdits(initial)
      if (res.data.sections.length > 0) {
        setActiveId((prev) => prev || res.data.sections[0].id)
      }
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [courseId, setError])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save single section
  const handleSaveSection = async (sectionId) => {
    const text = edits[sectionId] ?? ''
    setSavingSection((prev) => ({ ...prev, [sectionId]: true }))
    try {
      const res = await api.put(`/generation/course/${courseId}/editor/section/${sectionId}`, { text })
      // Update local section record
      setData((prev) => {
        if (!prev) return prev
        const updated = prev.sections.map((s) =>
          s.id === sectionId ? { ...s, text, status: res.data.status || 'EDITED' } : s
        )
        return { ...prev, sections: updated }
      })
      setSavedStatus((prev) => ({ ...prev, [sectionId]: true }))
      setTimeout(() => {
        setSavedStatus((prev) => ({ ...prev, [sectionId]: false }))
      }, 2500)
    } catch (err) {
      setError(`Failed to save section: ${errMsg(err)}`)
    } finally {
      setSavingSection((prev) => ({ ...prev, [sectionId]: false }))
    }
  }

  // Save all modified sections
  const handleSaveAll = async () => {
    if (!data) return
    const modified = data.sections.filter((s) => (edits[s.id] ?? '') !== (s.text ?? ''))
    if (modified.length === 0) {
      setInfo('All sections are already saved.')
      return
    }

    let savedCount = 0
    for (const s of modified) {
      await handleSaveSection(s.id)
      savedCount++
    }
    setInfo(`Saved ${savedCount} modified section(s) successfully.`)
  }

  // Export to Word docx
  const handleExportDocx = async (force = true) => {
    setExporting(true)
    setError('')
    try {
      const { data: res } = await api.post(`/generation/course/${courseId}${force ? '?force=true' : ''}`)
      const fileObj = {
        fileName: res.fileName,
        url: res.url,
        generatedAt: new Date().toISOString()
      }
      setGeneratedFile(fileObj)
      setInfo(
        res.pendingSections && res.pendingSections.length > 0
          ? `Course File generated with ${res.pendingSections.length} pending section(s). Click Download to open.`
          : 'Final Course File (.docx) compiled and ready for download!'
      )
      // Open in new tab or trigger download
      if (res.url) {
        window.open(res.url, '_blank', 'noopener')
      }
    } catch (err) {
      setError(`Export failed: ${errMsg(err)}`)
    } finally {
      setExporting(false)
    }
  }

  // Scroll to section
  const scrollToSection = (id) => {
    setActiveId(id)
    const el = sectionRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const ta = textareaRefs.current[id]
      if (ta) ta.focus()
    }
  }

  // Formatting helpers for text area
  const insertFormatting = (sectionId, type) => {
    const ta = textareaRefs.current[sectionId]
    const currentText = edits[sectionId] || ''
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = currentText.substring(start, end)
    let replacement = ''

    if (type === 'bold') {
      replacement = selected ? `**${selected}**` : '**Bold Text**'
    } else if (type === 'italic') {
      replacement = selected ? `*${selected}*` : '*Italic Text*'
    } else if (type === 'bullet') {
      if (selected) {
        replacement = selected
          .split('\n')
          .map((l) => (l.trim().startsWith('•') ? l : `• ${l}`))
          .join('\n')
      } else {
        replacement = '\n• Point 1\n• Point 2\n• Point 3\n'
      }
    } else if (type === 'numbered') {
      if (selected) {
        replacement = selected
          .split('\n')
          .map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '')}`)
          .join('\n')
      } else {
        replacement = '\n1. First step\n2. Second step\n3. Third step\n'
      }
    } else if (type === 'table') {
      replacement =
        '\n| Component / Metric | Criteria / Detail | Target Weightage | Attainment |\n' +
        '|--------------------|-------------------|------------------|------------|\n' +
        '| Internal Assessment| Assignments & Mid-Term | 40%           | Target Met |\n' +
        '| End-Term Exam      | Comprehensive Test| 60%              | Target Met |\n'
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end)
    setEdits((prev) => ({ ...prev, [sectionId]: newText }))

    // Restore focus
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 10)
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-12 text-center text-gray-400 flex items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-blue-400" size={24} />
        <span>Loading Course File document canvas...</span>
      </div>
    )
  }

  if (!data) return null

  // Calculate stats
  const totalSections = data.sections.length
  const completedSections = data.sections.filter((s) => (edits[s.id] || '').trim().length > 0).length
  const mandatoryMissing = data.sections.filter(
    (s) => s.mandatory && !(edits[s.id] || '').trim()
  ).length
  const modifiedCount = data.sections.filter((s) => (edits[s.id] ?? '') !== (s.text ?? '')).length

  // Filter sections for sidebar
  const filteredSections = data.sections.filter((s) => {
    const matchesSearch =
      search === '' ||
      `${s.number} ${s.title}`.toLowerCase().includes(search.toLowerCase())

    const hasText = (edits[s.id] || '').trim().length > 0
    const isModified = (edits[s.id] ?? '') !== (s.text ?? '')

    if (filter === 'MISSING') return matchesSearch && !hasText
    if (filter === 'EDITED') return matchesSearch && isModified
    if (filter === 'READY') return matchesSearch && hasText
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {data.course.code} – {data.course.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {data.course.semester}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
              <span>Coordinator: <strong className="text-gray-200">{data.course.coordinator}</strong></span>
              <span>•</span>
              <span>Total Sections: <strong className="text-gray-200">{totalSections}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {completedSections} of {totalSections} filled
              </span>
              {mandatoryMissing > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">
                    {mandatoryMissing} mandatory pending
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={btn.ghost}
              title="Toggle reading view"
            >
              <Eye size={16} className="inline mr-1" />
              {previewMode ? 'Edit Mode' : 'Reading Preview'}
            </button>

            <button
              onClick={handleSaveAll}
              disabled={modifiedCount === 0}
              className={`${btn.primary} flex items-center gap-1.5`}
              title="Save all modified sections"
            >
              <Save size={15} />
              Save All {modifiedCount > 0 ? `(${modifiedCount})` : ''}
            </button>

            <button
              onClick={() => handleExportDocx(true)}
              disabled={exporting}
              className={`${btn.good} flex items-center gap-1.5`}
            >
              {exporting ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  <span>Compiling Word File...</span>
                </>
              ) : (
                <>
                  <FileDown size={15} />
                  <span>Export Word (.docx)</span>
                </>
              )}
            </button>

            {generatedFile?.url && (
              <a
                href={generatedFile.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-medium border border-emerald-500/30 flex items-center gap-1"
                title="Download latest compiled file"
              >
                <CheckCircle2 size={15} />
                Download ({generatedFile.fileName})
              </a>
            )}
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
          <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round((completedSections / totalSections) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-300 min-w-[45px] text-right">
            {Math.round((completedSections / totalSections) * 100)}%
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Table of Contents & Quick Navigation */}
        <div className="lg:col-span-4 glass rounded-2xl p-4 sticky top-4 max-h-[82vh] flex flex-col border border-white/10">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <List size={16} className="text-blue-400" />
              Table of Contents
            </span>
            <span className="text-xs text-gray-400">{filteredSections.length} items</span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search sections (1-25)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1 mb-3 pb-2 border-b border-white/10 text-xs">
            {['ALL', 'READY', 'MISSING', 'EDITED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  filter === f
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Navigation Item List */}
          <div className="overflow-y-auto space-y-1 pr-1 flex-1 custom-scrollbar">
            {filteredSections.map((s) => {
              const hasText = (edits[s.id] || '').trim().length > 0
              const isModified = (edits[s.id] ?? '') !== (s.text ?? '')
              const isActive = activeId === s.id

              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-blue-600/30 text-white border border-blue-500/50 shadow-sm'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold ${
                        hasText ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {String(s.number).padStart(2, '0')}
                    </span>
                    <span className="truncate font-medium text-[12px]">{s.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isModified && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                    )}
                    {hasText ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : s.mandatory ? (
                      <AlertCircle size={13} className="text-amber-400" />
                    ) : null}
                  </div>
                </button>
              )
            })}
            {filteredSections.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-500">No matching sections found.</div>
            )}
          </div>
        </div>

        {/* Right Main Canvas: The 25 Official Sections */}
        <div className="lg:col-span-8 space-y-8">
          {/* Document Cover Card */}
          <div className="glass rounded-2xl p-8 border border-white/15 text-center shadow-2xl relative overflow-hidden bg-gradient-to-b from-blue-900/10 via-white/5 to-transparent">
            <div className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
              Official Course File Dossier
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              {data.course.code} – {data.course.title}
            </h1>
            <div className="text-sm text-gray-300 font-medium">
              Academic Term: {data.course.semester}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Course Coordinator: <span className="text-gray-200 font-semibold">{data.course.coordinator}</span>
            </div>
          </div>

          {/* Section Editors */}
          {data.sections.map((s) => {
            const hasContent = (edits[s.id] || '').trim().length > 0
            const isModified = (edits[s.id] ?? '') !== (s.text ?? '')
            const isSaving = savingSection[s.id]
            const isSaved = savedStatus[s.id]
            const wordCount = (edits[s.id] || '').trim().split(/\s+/).filter(Boolean).length

            return (
              <div
                key={s.id}
                ref={(el) => (sectionRefs.current[s.id] = el)}
                className={`glass rounded-2xl p-6 border transition-all duration-300 shadow-xl scroll-mt-6 ${
                  activeId === s.id
                    ? 'border-blue-500/60 ring-2 ring-blue-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setActiveId(s.id)}
              >
                {/* Section Header */}
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-bold flex items-center justify-center text-sm shadow-inner">
                      {s.number}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide leading-snug">
                        {s.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Scope: {s.scope.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span className={`text-[11px] font-medium ${s.mandatory ? 'text-amber-400' : 'text-gray-400'}`}>
                          {s.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                        <span>•</span>
                        <Badge value={s.status} label={s.status} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isModified && (
                      <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        Unsaved edits
                      </span>
                    )}
                    <button
                      onClick={() => handleSaveSection(s.id)}
                      disabled={isSaving || !isModified}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : isModified
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-white/5 text-gray-400 cursor-default'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <Check size={13} />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          <span>Save Section</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Editor Content Area */}
                {previewMode ? (
                  /* Reading Preview Mode */
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-gray-200 text-sm whitespace-pre-wrap leading-relaxed min-h-[100px]">
                    {hasContent ? (
                      edits[s.id]
                    ) : (
                      <span className="italic text-gray-500">
                        {s.mandatory ? '[Pending - no reviewed content entered yet]' : '[Not provided]'}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Live Interactive Editor Mode */
                  <div className="space-y-2">
                    {/* Rich Formatting Mini-Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10 flex-wrap text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.id, 'bold')}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Bold (**text**)"
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.id, 'italic')}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Italic (*text*)"
                        >
                          <Italic size={14} />
                        </button>
                        <div className="h-4 w-[1px] bg-white/15 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.id, 'bullet')}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Bullet list (• Item)"
                        >
                          <List size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.id, 'numbered')}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Numbered list (1. Item)"
                        >
                          <ListOrdered size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.id, 'table')}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                          title="Insert Markdown Table"
                        >
                          <Table size={14} />
                          <span>Insert Table</span>
                        </button>
                        <div className="h-4 w-[1px] bg-white/15 mx-1" />
                        <input
                          type="file"
                          ref={(el) => (fileInputs.current[s.id] = el)}
                          className="hidden"
                          accept=".docx,.pdf,.xlsx,.xls,.txt"
                          onChange={(e) => handleSectionUpload(s.id, e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputs.current[s.id]?.click()}
                          disabled={uploadingSection[s.id]}
                          className="p-1.5 rounded hover:bg-white/10 text-blue-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                          title="Upload document (.docx, .pdf, .xlsx) - auto-accepted without review"
                        >
                          <Upload size={13} />
                          <span>{uploadingSection[s.id] ? 'Extracting...' : 'Upload Doc'}</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-400 font-mono pr-1">
                        {wordCount} words • {(edits[s.id] || '').length} chars
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={(el) => (textareaRefs.current[s.id] = el)}
                      rows={Math.max(5, Math.min(18, ((edits[s.id] || '').split('\n').length || 1) + 2))}
                      value={edits[s.id] || ''}
                      onChange={(e) => setEdits({ ...edits, [s.id]: e.target.value })}
                      placeholder={`Enter official dossier content for Section ${s.number}: ${s.title}...`}
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-gray-100 text-sm font-sans focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-gray-600 leading-relaxed custom-scrollbar resize-y"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

