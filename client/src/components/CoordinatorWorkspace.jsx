import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, History, Lock, RefreshCw, Sparkles, FileDown } from 'lucide-react'
import api, { errMsg } from '../api'
import { Badge, Modal, Notice, btn, fmt, input, toIso } from './ui'
import { DownloadButton } from './FacultyWorkspace'

const TABS = [
  ['overview', 'Overview'],
  ['submissions', 'Submissions'],
  ['common', 'Common info'],
  ['final', 'AI review and final file'],
]

function ReviewModal({ row, onClose, onDone }) {
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const send = async (status) => {
    setError('')
    try { await api.post(`/submissions/${row.current.id}/review`, { status, comments: comments || (status === 'APPROVED' ? 'Approved' : '') }); onDone() }
    catch (e) { setError(errMsg(e)) }
  }
  return (
    <Modal title={`Review: ${row.number}. ${row.title} (Section ${row.sectionName})`} onClose={onClose}>
      <div className="text-sm text-gray-300 mb-2">{row.current?.fileName}</div>
      {row.validationMessage && <Notice kind="warn">{row.validationMessage}</Notice>}
      <textarea className={`${input} mt-3`} rows={3} placeholder="Comment for the faculty member (required when sending back)" value={comments} onChange={(e) => setComments(e.target.value)} />
      <div className="mt-2"><Notice>{error}</Notice></div>
      <div className="flex justify-between mt-4 gap-2 flex-wrap">
        <DownloadButton submissionId={row.current.id} label="Open file" />
        <div className="flex gap-2">
          <button className={btn.danger} disabled={!comments.trim()} onClick={() => send('REVISION_REQUESTED')}>Send back</button>
          <button className={btn.good} onClick={() => send('APPROVED')}>Approve</button>
        </div>
      </div>
    </Modal>
  )
}

function Overview({ c, reload, courseId, setError }) {
  const [review, setReview] = useState(null)
  const flagged = c.items.filter((i) => i.needsAttention && i.current)

  const reopenPart = async (sectionId, partId) => {
    const reason = prompt('Reason for sending this part back (optional):') ?? null
    if (reason === null) return
    try { await api.post(`/course-file/${courseId}/sections/${sectionId}/parts/${partId}/reopen`, { reason }); reload() } catch (e) { setError(errMsg(e)) }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {c.sections.map((s) => {
          const pct = s.mandatoryTotal ? Math.round((s.completed / s.mandatoryTotal) * 100) : 0
          return (
            <div key={s.id} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-white font-semibold">Section {s.name}</div>
                {s.finalSubmittedAt ? <Badge value="SUBMITTED" label="COMPLETE SUBMISSION" /> : <Badge value="PENDING" label="IN PROGRESS" />}
              </div>
              <div className="text-xs text-gray-400 mb-3">{s.faculty.map((f) => f.name).join(', ') || 'No faculty assigned'}</div>
              <div className="w-full h-2 rounded bg-white/10 mb-1"><div className="h-2 rounded bg-green-500" style={{ width: `${pct}%` }} /></div>
              <div className="text-xs text-gray-400 mb-3">{s.completed}/{s.mandatoryTotal} required complete - {s.pending} pending - {s.invalid} invalid - {s.needsReview} flagged</div>
              <div className="space-y-1">
                {s.parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <Badge value={p.status} />
                      {p.status === 'SUBMITTED' && <button className="text-xs text-gray-400 hover:text-white underline" onClick={() => reopenPart(s.id, p.id)}>send back</button>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="text-white font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-400" />Needs your attention ({flagged.length})</div>
        {flagged.length === 0 && <p className="text-sm text-gray-400">No flagged submissions.</p>}
        {flagged.map((r) => (
          <div key={r.itemId} className="flex items-center justify-between gap-3 p-3 mt-2 rounded-lg bg-white/5">
            <div className="min-w-0">
              <div className="text-white text-sm">Section {r.sectionName} - {r.number}. {r.title}</div>
              <div className="text-xs text-gray-400 truncate">{r.current.fileName} - {r.validationMessage}</div>
            </div>
            <div className="flex items-center gap-2"><Badge value={r.validationStatus} /><button className={btn.ghost} onClick={() => setReview(r)}>Review</button></div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="text-white font-semibold mb-3">Common course information (sections 1-8)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {c.common.map((s) => (
            <div key={s.number} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
              <span className="text-gray-200">{s.number}. {s.title}</span>
              <Badge value={s.filled ? 'SUBMITTED' : 'PENDING'} label={s.filled ? 'FILLED' : 'MISSING'} />
            </div>
          ))}
        </div>
      </div>

      {review && <ReviewModal row={review} onClose={() => setReview(null)} onDone={() => { setReview(null); reload() }} />}
    </div>
  )
}

function Submissions({ c, reload, courseId, setError, setInfo }) {
  const [deadline, setDeadline] = useState('')
  const [partId, setPartId] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [versions, setVersions] = useState(null)
  const parts = [...new Set(c.items.map((i) => i.partName).filter(Boolean))]
  const partIdByName = {}
  c.sections.forEach((s) => s.parts.forEach((p) => { partIdByName[p.name] = p.id }))

  const setDl = async () => {
    setError(''); setInfo('')
    try {
      const { data } = await api.put(`/submissions/course/${courseId}/deadline`, { deadline: toIso(deadline), ...(partId ? { partId: Number(partId) } : {}) })
      setInfo(`Deadline set on ${data.updated} item(s).`)
      reload()
    } catch (e) { setError(errMsg(e)) }
  }

  const reopen = async (itemId) => {
    const days = Number(prompt('Reopen for how many days?', '3'))
    if (!days) return
    try {
      await api.post(`/submissions/items/${itemId}/reopen`, { until: new Date(Date.now() + days * 864e5).toISOString(), reason: 'Reopened by coordinator' })
      reload()
    } catch (e) { setError(errMsg(e)) }
  }

  const openVersions = async (itemId, title) => {
    try { const { data } = await api.get(`/submissions/items/${itemId}/versions`); setVersions({ title, list: data.versions }) } catch (e) { setError(errMsg(e)) }
  }

  const rows = c.items.filter((r) => filter === 'ALL' || r.status === filter || (filter === 'FLAGGED' && r.needsAttention))

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-5 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Submission deadline</label>
          <input type="datetime-local" className={input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Applies to</label>
          <select className={input} value={partId} onChange={(e) => setPartId(e.target.value)}>
            <option value="">Whole course file</option>
            {parts.map((n) => <option key={n} value={partIdByName[n]}>{n}</option>)}
          </select>
        </div>
        <button className={btn.primary} disabled={!deadline} onClick={setDl}>Set deadline</button>
        <p className="text-xs text-gray-500 w-full">Items lock automatically at the deadline. Setting a later deadline unlocks them; you can also reopen a single item below.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'SUBMITTED', 'INVALID', 'LOCKED', 'FLAGGED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300'}`}>{f}</button>
        ))}
      </div>

      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left"><tr><th className="p-3">Sec.</th><th className="p-3">Course File section</th><th className="p-3">Status</th><th className="p-3">File</th><th className="p-3">Deadline</th><th className="p-3" /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.itemId} className="border-t border-white/10 align-top">
                <td className="p-3 text-gray-300">{r.sectionName}</td>
                <td className="p-3 text-white">{r.number}. {r.title}{!r.mandatory && <span className="text-xs text-gray-500"> (optional)</span>}</td>
                <td className="p-3"><div className="flex gap-1 flex-wrap"><Badge value={r.status} />{r.needsAttention && r.status !== 'INVALID' && <Badge value={r.validationStatus} />}</div></td>
                <td className="p-3 text-gray-300 max-w-[220px] truncate">{r.current ? `v${r.current.versionNumber} ${r.current.fileName}` : '-'}</td>
                <td className="p-3 text-gray-400 whitespace-nowrap">{fmt(r.deadline)}</td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    {r.current && <DownloadButton submissionId={r.current.id} />}
                    {r.versionCount > 0 && <button className={btn.ghost} onClick={() => openVersions(r.itemId, r.title)} title="Versions"><History size={16} /></button>}
                    {r.locked && <button className={btn.ghost} onClick={() => reopen(r.itemId)} title="Reopen"><Lock size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {versions && (
        <Modal title={`Versions - ${versions.title}`} onClose={() => setVersions(null)}>
          {versions.list.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 mt-2 rounded bg-white/5 text-sm">
              <div><div className="text-white">v{v.versionNumber} {v.fileName}</div><div className="text-xs text-gray-400">{fmt(v.uploadedAt)} - {v.uploadedBy}{v.isDeleted ? ' - deleted' : ''}{v.isCurrentVersion && !v.isDeleted ? ' - current' : ''}</div></div>
              {!v.isDeleted && <DownloadButton submissionId={v.id} />}
            </div>
          ))}
        </Modal>
      )}
    </div>
  )
}

function CommonInfo({ courseId, setError, setInfo }) {
  const [data, setData] = useState(null)
  const [edits, setEdits] = useState({})
  const load = () => api.get(`/courses/${courseId}/common-info`).then(({ data }) => { setData(data); setEdits({}) }).catch((e) => setError(errMsg(e)))
  useEffect(() => { load() }, [courseId])
  if (!data) return <div className="text-gray-400">Loading...</div>

  const save = async () => {
    setError(''); setInfo('')
    try {
      await api.put(`/courses/${courseId}/common-info`, { sections: Object.entries(edits).map(([id, text]) => ({ templateSectionId: Number(id), text })) })
      setInfo('Common information saved.'); load()
    } catch (e) { setError(errMsg(e)) }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Filled once here, so faculty do not have to repeat it. Sections already known from the course record show their current text; typing here overrides it in the final file.</p>
      {data.sections.map((s) => (
        <div key={s.templateSectionId} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2"><span className="text-white font-medium">{s.number}. {s.title}</span><span className="text-xs text-gray-500">source: {s.source}</span></div>
          <textarea className={input} rows={4} value={edits[s.templateSectionId] ?? s.text ?? ''} onChange={(e) => setEdits({ ...edits, [s.templateSectionId]: e.target.value })} />
        </div>
      ))}
      <div className="flex justify-end"><button className={btn.primary} disabled={!Object.keys(edits).length} onClick={save}>Save changes</button></div>
    </div>
  )
}

function AiAndFinal({ courseId, c, setError, setInfo }) {
  const [content, setContent] = useState({ content: [], jobs: [] })
  const [edits, setEdits] = useState({})
  const [sources, setSources] = useState(null)
  const [manualFor, setManualFor] = useState('')
  const [manualText, setManualText] = useState('')
  const [missing, setMissing] = useState(null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api.get(`/consolidation/course/${courseId}/content`).then(({ data }) => setContent(data)).catch((e) => setError(errMsg(e))), [courseId])
  useEffect(() => { load(); api.get(`/generation/course/${courseId}/latest`).then(({ data }) => setFile(data)).catch(() => {}) }, [load, courseId])

  const running = content.jobs.some((j) => j.state === 'QUEUED' || j.state === 'RUNNING')
  useEffect(() => { if (!running) return; const t = setInterval(load, 3000); return () => clearInterval(t) }, [running, load])

  const run = async (force) => {
    setError(''); setInfo('')
    try {
      const { data } = await api.post(`/consolidation/course/${courseId}/run${force ? '?force=true' : ''}`)
      setInfo(data.queued.length ? `Consolidating sections ${data.queued.join(', ')}...` : 'No submissions to consolidate yet.')
      load()
    } catch (e) { setError(errMsg(e)) }
  }

  const act = (fn) => async () => { setError(''); try { await fn(); await load() } catch (e) { setError(errMsg(e)) } }

  const showSources = async (id) => {
    try { const { data } = await api.get(`/consolidation/content/${id}/sources`); setSources(data.sources) } catch (e) { setError(errMsg(e)) }
  }

  const addManual = act(async () => {
    await api.post(`/consolidation/course/${courseId}/content`, { templateSectionId: Number(manualFor), text: manualText })
    setManualText(''); setManualFor('')
  })

  const generate = async (force) => {
    setBusy(true); setError(''); setInfo(''); setMissing(null)
    try {
      const { data } = await api.post(`/generation/course/${courseId}${force ? '?force=true' : ''}`)
      setFile({ fileName: data.fileName, url: data.url, generatedAt: new Date().toISOString() })
      setInfo(data.pendingSections.length ? `Generated, but sections ${data.pendingSections.join(', ')} are still pending.` : 'Final Course File generated.')
    } catch (e) {
      const m = e.response?.data?.details?.missing
      if (m) setMissing(m); else setError(errMsg(e))
    } finally { setBusy(false) }
  }

  const sectionOptions = [...new Map(c.items.map((i) => [i.templateSectionId, [i.templateSectionId, i.number, i.title]])).values()].sort((a, b) => a[1] - b[1])

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-300">AI combines what faculty submitted for each section into one version, without repeating the same content. You review every result before it goes in the final file.</div>
        <div className="flex gap-2">
          <button className={btn.primary} disabled={running} onClick={() => run(false)}><span className="inline-flex items-center gap-1"><Sparkles size={14} />{running ? 'Working...' : 'Run AI consolidation'}</span></button>
          <button className={btn.ghost} onClick={() => run(true)} title="Also regenerates text you already accepted or edited"><RefreshCw size={14} /></button>
        </div>
      </div>

      {content.jobs.filter((j) => j.state === 'FAILED').map((j) => <Notice key={j.templateSectionId}>Consolidation failed for section id {j.templateSectionId}: {j.error}</Notice>)}

      {content.content.map((r) => (
        <div key={r.id} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="text-white font-medium">{r.number}. {r.title}</div>
            <div className="flex items-center gap-2">
              <Badge value={r.isManual ? 'ACCEPTED' : r.reviewStatus} label={r.isManual ? 'MANUAL' : r.isAiGenerated ? `AI - ${r.reviewStatus}` : r.reviewStatus} />
              {r.sourceCount > 0 && <button className="text-xs text-gray-400 hover:text-white underline" onClick={() => showSources(r.id)}>{r.sourceCount} source(s)</button>}
            </div>
          </div>
          <textarea className={input} rows={6} value={edits[r.id] ?? r.text ?? ''} onChange={(e) => setEdits({ ...edits, [r.id]: e.target.value })} />
          <div className="flex justify-end gap-2 mt-2">
            {edits[r.id] !== undefined && edits[r.id] !== r.text && <button className={btn.primary} onClick={act(async () => { await api.put(`/consolidation/content/${r.id}`, { text: edits[r.id] }); setEdits((e) => { const n = { ...e }; delete n[r.id]; return n }) })}>Save edit</button>}
            {r.isAiGenerated && <>
              <button className={btn.danger} onClick={act(() => api.patch(`/consolidation/content/${r.id}/decision`, { decision: 'REJECTED' }))}>Reject</button>
              <button className={btn.good} onClick={act(() => api.patch(`/consolidation/content/${r.id}/decision`, { decision: 'ACCEPTED' }))}>Accept</button>
            </>}
          </div>
        </div>
      ))}
      {!content.content.length && <p className="text-sm text-gray-400">Nothing consolidated yet.</p>}

      <div className="glass rounded-xl p-4 space-y-2">
        <div className="text-white font-medium">Add content by hand</div>
        <p className="text-xs text-gray-500">For anything faculty did not submit, or to replace AI text with your own. Kept separate from AI content in the final file.</p>
        <select className={input} value={manualFor} onChange={(e) => setManualFor(e.target.value)}>
          <option value="">Choose a Course File section...</option>
          {sectionOptions.map(([id, n, t]) => <option key={id} value={id}>{n}. {t}</option>)}
        </select>
        <textarea className={input} rows={4} value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Content for this section" />
        <div className="flex justify-end"><button className={btn.primary} disabled={!manualFor || !manualText.trim()} onClick={addManual}>Add</button></div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-white font-semibold">Final Course File (.docx)</div>
            {file ? <div className="text-xs text-gray-400">Latest: {file.fileName} - {fmt(file.generatedAt)}</div> : <div className="text-xs text-gray-400">Not generated yet</div>}
          </div>
          <div className="flex gap-2">
            {file?.url && <a className={btn.ghost} href={file.url} target="_blank" rel="noreferrer"><span className="inline-flex items-center gap-1"><FileDown size={14} />Download</span></a>}
            <button className={btn.good} disabled={busy} onClick={() => generate(false)}><span className="inline-flex items-center gap-1"><CheckCircle size={14} />{busy ? 'Generating...' : 'Generate final file'}</span></button>
          </div>
        </div>
        {missing && (
          <div className="mt-3 space-y-2">
            <Notice kind="warn">These required sections have no reviewed content yet: {missing.map((m) => `${m.number}. ${m.title}`).join('; ')}</Notice>
            <button className={btn.ghost} onClick={() => generate(true)}>Generate anyway (mark them pending)</button>
          </div>
        )}
      </div>

      {sources && (
        <Modal title="Source documents" onClose={() => setSources(null)}>
          {sources.map((s) => <div key={s.submissionId} className="p-3 mt-2 rounded bg-white/5 text-sm"><div className="text-white">{s.fileName}</div><div className="text-xs text-gray-400">Section {s.sectionName} - {s.uploadedBy} - v{s.versionNumber}</div></div>)}
        </Modal>
      )}
    </div>
  )
}

export default function CoordinatorWorkspace({ courseId }) {
  const [tab, setTab] = useState('overview')
  const [c, setC] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const load = useCallback(() => api.get(`/course-file/${courseId}/completion`).then(({ data }) => setC(data)).catch((e) => setError(errMsg(e))), [courseId])
  useEffect(() => { load() }, [load])

  // The relevance check is asynchronous; keep the overview fresh while files are being checked.
  const checking = c?.items.some((i) => i.validationStatus === 'NOT_CHECKED')
  useEffect(() => { if (!checking) return; const t = setInterval(load, 4000); return () => clearInterval(t) }, [checking, load])

  if (!c) return error ? <Notice>{error}</Notice> : <div className="text-gray-400">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([k, label]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-sm ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>{label}</button>)}
      </div>
      <Notice>{error}</Notice>
      <Notice kind="ok">{info}</Notice>
      {tab === 'overview' && <Overview c={c} reload={load} courseId={courseId} setError={setError} />}
      {tab === 'submissions' && <Submissions c={c} reload={load} courseId={courseId} setError={setError} setInfo={setInfo} />}
      {tab === 'common' && <CommonInfo courseId={courseId} setError={setError} setInfo={setInfo} />}
      {tab === 'final' && <AiAndFinal courseId={courseId} c={c} setError={setError} setInfo={setInfo} />}
    </div>
  )
}
