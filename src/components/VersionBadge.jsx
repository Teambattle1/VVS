import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { VERSION } from '../lib/version.js'
import { CHANGELOG } from '../lib/changelog.js'
import ChangelogDialog from './ChangelogDialog.jsx'

export default function VersionBadge({ className }) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
          'bg-slate-100 text-slate-600 hover:bg-slate-200',
          'dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
          className
        )}
        title="Se alle nye features"
      >
        <Sparkles className="w-3 h-3" strokeWidth={2.5} />
        v{VERSION}
      </button>
      {showDialog && <ChangelogDialog changelog={CHANGELOG} onClose={() => setShowDialog(false)} />}
    </>
  )
}
