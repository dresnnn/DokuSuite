import { useRef, useState } from 'react'
import { apiClient } from '../../lib/api'
import { useToast } from './Toast'

type Props = {
  onUploaded?: () => void
}

export default function PhotoUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async () => {
    if (!file) return
    try {
      const { data } = await apiClient.POST('/photos/upload-intent', {
        body: { contentType: file.type, size: file.size },
      })
      if (!data?.url) throw new Error('Missing upload url')
      const form = new FormData()
      Object.entries(data.fields || {}).forEach(([k, v]) => form.append(k, v))
      form.append('file', file)
      await fetch(data.url, {
        method: 'POST',
        body: form,
      })
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploaded?.()
      showToast('success', 'Photo uploaded')
    } catch {
      showToast('error', 'Upload failed')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        data-testid="photo-upload-input"
      />
      <button
        onClick={handleUpload}
        disabled={!file}
        data-testid="photo-upload-button"
      >
        Upload
      </button>
    </div>
  )
}

