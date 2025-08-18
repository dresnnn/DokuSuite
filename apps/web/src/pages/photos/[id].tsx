import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiClient } from '../../../lib/api'
import { useToast } from '../../components/Toast'

const PhotoMap = dynamic(() => import('../../components/PhotoMap'), {
  ssr: false,
})

type Photo = {
  quality_flag?: string | null
  note?: string | null
  mode?: string | null
  site_id?: string | null
  device_id?: string | null
  uploader_id?: string | null
  ad_hoc_spot?: { lat: number; lon: number } | null
}

export default function PhotoDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [photo, setPhoto] = useState<Photo>({})
  const { showToast } = useToast()

  useEffect(() => {
    if (!id) return
    const fetchPhoto = async () => {
      const { data } = await apiClient.GET('/photos/{id}', {
        params: { path: { id: Number(id) } },
      })
      if (data) setPhoto(data)
    }
    fetchPhoto()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setPhoto((p) => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await apiClient.PATCH('/photos/{id}', {
        params: { path: { id: Number(id) } },
        body: {
          quality_flag: photo.quality_flag || null,
          note: photo.note || null,
          mode: photo.mode || null,
          site_id: photo.site_id || null,
          device_id: photo.device_id || null,
          uploader_id: photo.uploader_id || null,
        },
      })
      showToast('success', 'Photo updated')
    } catch {
      showToast('error', 'Update failed')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
      <label>
        Quality Flag:
        <input
          name="quality_flag"
          value={photo.quality_flag || ''}
          onChange={handleChange}
        />
      </label>
      <label>
        Note:
        <textarea
          name="note"
          value={photo.note || ''}
          onChange={handleChange}
        />
      </label>
      <label>
        Mode:
        <select name="mode" value={photo.mode || ''} onChange={handleChange}>
          <option value=""></option>
          <option value="FIXED_SITE">FIXED_SITE</option>
          <option value="MOBILE">MOBILE</option>
        </select>
      </label>
      <label>
        Site ID:
        <input name="site_id" value={photo.site_id || ''} onChange={handleChange} />
      </label>
      <label>
        Device ID:
        <input
          name="device_id"
          value={photo.device_id || ''}
          onChange={handleChange}
        />
      </label>
      <label>
        Uploader ID:
        <input
          name="uploader_id"
          value={photo.uploader_id || ''}
          onChange={handleChange}
        />
      </label>
      <button type="submit">Save</button>
      </form>
      {id && (
        <PhotoMap
          photoId={Number(id)}
          adHocSpot={photo.ad_hoc_spot ?? undefined}
          initialPosition={{ lat: 0, lon: 0 }}
        />
      )}
    </>
  )
}

