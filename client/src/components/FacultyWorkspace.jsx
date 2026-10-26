import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Upload, Type, History, Trash2, Download, Lock, CheckCircle, Send, Package } from 'lucide-react'
import api, { errMsg } from '../api'
import { Badge, Modal, Notice, btn, fmt, input } from './ui'

// Faculty submission flow:
//   upload a file (or type the content) per Course File section -> automatic check ->
//   fix anything INVALID -> "Submit part" for each group of sections -> "Complete submission".

function TextModal({ item, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true); setError('')
    try { await api.post(`/submissions/items/${item.itemId}`, { text }); onSaved() }
    catch (e) { setError(errMsg(e)); setSaving(false) }
  }
  return (
    <Modal title={`${item.number}. ${item.title} - enter text`} onClose={onClose} wide>
      <Notice>{error}</Notice>
      <textarea className={`${input} mt-3`} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste the content for this section (min. 20 characters)" />
      <div className="flex justify-end gap-2 mt-4">
        <button className={btn.ghost} onClick={onClose}>Cancel</button>
        <button className={btn.primary} disabled={saving || text.trim().length < 20} onClick={save}>{saving ? 'Saving...' : 'Submit text'}</button>
      </div>
    </Modal>
  )
}

function VersionsModal({ item, onClose, onChanged }) {
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState('')
  const load = () => api.get(`/submissions/items/${item.itemId}/versions`).then(({ data }) => setVersions(data.versions)).catch((e) => setError(errMsg(e)))
  useEffect(() => { load() }, [])

  const restore = async (n) => {
    try { await api.post(`/submissions/items/${item.itemId}/versions/${n}/restore`); await load(); onChanged() }
    catch (e) { setError(errMsg(e)) }
  }
  return (
    <Modal title={`Version history - ${item.title}`} onClose={onClose} wide>
      <Notice>{error}</Notice>
      {!versions ? <p className="text-gray-400">Loading...</p> : versions.map((v) => (
        <div key={v.id} className={`flex items-center justify-between gap-3 p-3 mt-2 rounded-lg ${v.isCurrentVersion && !v.isDeleted ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-white/5'}`}>
          <div className="min-w-0">
            <div className="text-white text-sm truncate">v{v.versionNumber} - {v.fileName} {v.isDeleted && <span className="text-red-400">(deleted)</span>}</div>
            <div className="text-xs text-gray-400">{fmt(v.uploadedAt)} - {v.uploadedBy}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {v.isCurrentVersion && !v.isDeleted ? <Badge value="SUBMITTED" label="CURRENT" /> : !v.isDeleted && <button className={btn.ghost} onClick={() => restore(v.versionNumber)}>Make current</button>}
            {!v.isDeleted && <DownloadButton submissionId={v.id} />}
          </div>
        </div>
      ))}
    </Modal>
  )
}

export function DownloadButton({ submissionId, label }) {
  const open = async () => {
    try {
      const { data } = await api.get(`/submissions/${submissionId}/download`)
      if (data.url) window.open(data.url, '_blank', 'noopener')
      else window.open(URL.createObjectURL(new Blob([data.text || ''], { type: 'text/plain' })), '_blank')
    } catch (e) { alert(errMsg(e)) }
  }
  return <button className={btn.ghost} onClick={open} title="Download">{label || <Download size={16} />}</button>
}

function ItemRow({ item, onChanged, setError }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)

  const upload = async (file) => {
    if (!file) return
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/submissions/items/${item.itemId}`, fd)
      await onChanged()
    } catch (e) { setError(`${item.title}: ${errMsg(e)}`) }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const remove = async () => {
    if (!confirm(`Delete the current submission for "${item.title}"?`)) return
    setBusy(true); setError('')
    try { await api.delete(`/submissions/items/${item.itemId}`); await onChanged() }
    catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }

  const checking = item.validationStatus === 'NOT_CHECKED'
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{item.number}. {item.title}</span>
            {!item.mandatory && <span className="text-xs text-gray-400">(optional)</span>}
            <Badge value={item.status} />
            {checking && <Badge value="NOT_CHECKED" />}
            {item.validationStatus === 'NEEDS_REVIEW' && <Badge value="NEEDS_REVIEW" />}
            {item.status === 'LOCKED' && <Lock size={14} className="text-orange-400" />}
          </div>
          {item.current && (
            <div className="text-xs text-gray-400 mt-1">
              v{item.current.versionNumber} - {item.current.fileName} - {fmt(item.current.uploadedAt)}
            </div>
          )}
          {item.validationMessage && (
            <div className={`text-xs mt-1 ${item.validationStatus === 'INVALID' ? 'text-red-400' : 'text-yellow-300'}`}>{item.validationMessage}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Deadline: {fmt(item.deadline)}
            {item.reopenedUntil && <span className="text-yellow-300"> - reopened until {fmt(item.reopenedUntil)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button className={btn.primary} disabled={busy || item.locked} onClick={() => fileRef.current?.click()}>
            <span className="inline-flex items-center gap-1"><Upload size={14} />{item.current ? 'Replace' : 'Upload'}</span>
          </button>
          <button className={btn.ghost} disabled={busy || item.locked} onClick={() => setModal('text')} title="Enter text instead of a file"><Type size={16} /></button>
          {item.current && <DownloadButton submissionId={item.current.id} />}
          {item.versionCount > 0 && <button className={btn.ghost} onClick={() => setModal('versions')} title="Version history"><History size={16} /></button>}
          {item.current && <button className={btn.danger} disabled={busy || item.locked} onClick={remove} title="Delete"><Trash2 size={16} /></button>}
        </div>
      </div>
      {modal === 'text' && <TextModal item={item} onClose={() => setModal(null)} onSaved={() => { setModal(null); onChanged() }} />}
      {modal === 'versions' && <VersionsModal item={item} onClose={() => setModal(null)} onChanged={onChanged} />}
    </div>
  )
}

function PartCard({ part, section, courseId, onChanged, setError, setInfo }) {
  const [open, setOpen] = useState(part.status !== 'SUBMITTED')
  const [busy, setBusy] = useState(false)

  const submitPart = async () => {
    setBusy(true); setError(''); setInfo('')
    try {
      await api.post(`/course-file/${courseId}/sections/${section.id}/parts/${part.id}/submit`)
      setInfo(`"${part.name}" submitted for Section ${section.name}.`)
      await onChanged()
    } catch (e) {
      const missing = e.response?.data?.details?.missing
      setError(missing ? `${errMsg(e)}: ${missing.map((m) => `${m.number}. ${m.title} (${m.reason})`).join('; ')}` : errMsg(e))
    } finally { setBusy(false) }
  }

  const pct = part.mandatoryTotal ? Math.round((part.mandatoryDone / part.mandatoryTotal) * 100) : 100
  return (
    <div className="glass rounded-xl">
      <div className="flex items-center justify-between gap-4 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          <div className="min-w-0">
            <div className="text-white font-semibold">Part {part.number}: {part.name}</div>
            <div className="text-xs text-gray-400">{part.mandatoryDone}/{part.mandatoryTotal} required sections complete</div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="hidden sm:block w-24 h-2 rounded bg-white/10"><div className="h-2 rounded bg-green-500" style={{ width: `${pct}%` }} /></div>
          <Badge value={part.status} />
          {part.status === 'SUBMITTED'
            ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={14} />{fmt(part.submittedAt)}</span>
            : <button className={btn.good} disabled={!part.canSubmit || busy} onClick={submitPart}><span className="inline-flex items-center gap-1"><Send size={14} />{part.status === 'REOPENED' ? 'Resubmit part' : 'Submit part'}</span></button>}
        </div>
      </div>
      {open && (
        <div className="p-4 pt-0 space-y-3">
          {part.status === 'REOPENED' && <Notice kind="warn">This part was reopened (by you editing it, or by the coordinator). Submit it again when ready.</Notice>}
          {part.items.map((it) => <ItemRow key={it.itemId} item={it} onChanged={onChanged} setError={setError} />)}
        </div>
      )}
    </div>
  )
}

export default function FacultyWorkspace({ courseId }) {
  const [data, setData] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get(`/course-file/${courseId}/workspace`)
      setData(d)
      setActiveSection((cur) => cur ?? d.sections[0]?.id ?? null)
    } catch (e) { setError(errMsg(e)) }
  }, [courseId])

  useEffect(() => { load() }, [load])

  // The relevance check runs in the background: poll while anything is still being checked.
  const anyChecking = data?.sections.some((s) => [...s.parts.flatMap((p) => p.items), ...s.ungrouped].some((i) => i.validationStatus === 'NOT_CHECKED'))
  useEffect(() => {
    if (!anyChecking) return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [anyChecking, load])

  if (!data) return error ? <Notice>{error}</Notice> : <div className="text-gray-400">Loading...</div>
  const section = data.sections.find((s) => s.id === activeSection) || data.sections[0]
  if (!section) return <div className="glass rounded-xl p-8 text-gray-400">You have no sections assigned in this course.</div>

  const complete = async () => {
    if (!confirm(`Complete the submission for Section ${section.name}? You can still edit later, but you will need to resubmit.`)) return
    setBusy(true); setError(''); setInfo('')
    try {
      const { data: r } = await api.post(`/course-file/${courseId}/sections/${section.id}/complete`)
      setInfo(r.courseFileReady ? 'Complete submission done. All sections are in - the Course File is now with the coordinator.' : 'Complete submission done for this section.')
      await load()
    } catch (e) {
      const mp = e.response?.data?.details?.missingParts
      setError(mp ? `${errMsg(e)}: ${mp.join(', ')}` : errMsg(e))
    } finally { setBusy(false) }
  }

  const allItems = section.parts.flatMap((p) => p.items)
  const mandatory = allItems.filter((i) => i.mandatory)
  const done = mandatory.filter((i) => i.complete).length

  return (
    <div className="space-y-4">
      {data.sections.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {data.sections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`px-4 py-2 rounded-lg text-sm ${s.id === section.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
              Section {s.name}{s.finalSubmittedAt ? ' - done' : ''}
            </button>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-white font-semibold flex items-center gap-2"><Package size={18} />Section {section.name} - Course File submission</div>
          <div className="text-sm text-gray-400 mt-1">
            {done}/{mandatory.length} required sections complete - {section.parts.filter((p) => p.status === 'SUBMITTED').length}/{section.parts.length} parts submitted
          </div>
        </div>
        {section.finalSubmittedAt
          ? <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={18} />Completed {fmt(section.finalSubmittedAt)}</div>
          : <button className={btn.good} disabled={!section.canComplete || busy} onClick={complete}>Complete submission</button>}
      </div>

      <Notice>{error}</Notice>
      <Notice kind="ok">{info}</Notice>

      {section.parts.map((p) => <PartCard key={`${section.id}-${p.id}`} part={p} section={section} courseId={courseId} onChanged={load} setError={setError} setInfo={setInfo} />)}

      {section.ungrouped.length > 0 && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="text-white font-semibold">Other sections</div>
          {section.ungrouped.map((it) => <ItemRow key={it.itemId} item={it} onChanged={load} setError={setError} />)}
        </div>
      )}
    </div>
  )
}
