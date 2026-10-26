import { X } from 'lucide-react'

const BADGES = {
  PENDING: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  SUBMITTED: 'bg-green-500/20 text-green-400 border-green-500/30',
  INVALID: 'bg-red-500/20 text-red-400 border-red-500/30',
  LOCKED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NEEDS_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  NOT_CHECKED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  OPEN: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  REOPENED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DRAFT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EDITED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ACCEPTED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const LABELS = { NOT_CHECKED: 'CHECKING', NEEDS_REVIEW: 'NEEDS REVIEW', SUBMITTED_FOR_REVIEW: 'SUBMITTED' }

export function Badge({ value, label }) {
  if (!value) return null
  return (
    <span className={`px-2 py-0.5 rounded text-xs border whitespace-nowrap ${BADGES[value] || BADGES.PENDING}`}>
      {label || LABELS[value] || String(value).replace(/_/g, ' ')}
    </span>
  )
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className={`glass rounded-xl p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const Notice = ({ kind = 'error', children }) =>
  children ? (
    <div className={`rounded-lg p-3 text-sm border ${kind === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : kind === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'}`}>
      {children}
    </div>
  ) : null

export const btn = {
  primary: 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed',
  ghost: 'px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed',
  good: 'px-4 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed',
  danger: 'px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed',
}

export const input = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm'

export const fmt = (d) => (d ? new Date(d).toLocaleString() : '-')
export const toIso = (localValue) => new Date(localValue).toISOString()
