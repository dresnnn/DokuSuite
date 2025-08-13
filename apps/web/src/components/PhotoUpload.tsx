import { useState } from 'react'
import { apiClient } from '../../lib/api'

type Props = {
  onUploaded?: () => void
}

export default function PhotoUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file) return
    const { data } = await apiClient.POST('/photos/upload-intent', {
      body: { contentType: file.type, size: file.size },
    })
    if (!data?.url) return
    const form = new FormData()
    Object.entries(data.fields || {}).forEach(([k, v]) => form.append(k, v))
    form.append('file', file)
    await fetch(data.url, {
      method: 'POST',
      body: form,
    })
    setFile(null)
    onUploaded?.()
  }

  return (
    <div>
      <input
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

