import ReactMarkdown from 'react-markdown'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface Props {
  content: string
  streaming?: boolean
}

export default function AIOutput({ content, streaming }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!content) return null

  return (
    <div className="relative mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <button
        onClick={copy}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-500"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      </button>
      <div className="prose prose-sm max-w-none pr-8 text-slate-800">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {streaming && (
        <span className="inline-block w-1.5 h-4 bg-brand-500 animate-pulse ml-0.5" />
      )}
    </div>
  )
}
