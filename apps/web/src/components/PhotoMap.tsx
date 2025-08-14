import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { apiClient } from '../../lib/api'

type Photo = {
  id: number
  ad_hoc_spot?: {
    lat: number
    lon: number
  }
}

type Props = {
  shareToken?: string
  photoId?: number
  adHocSpot?: { lat: number; lon: number }
}

export default function PhotoMap({ shareToken, photoId, adHocSpot }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    if (photoId && adHocSpot) {
      map.setView([adHocSpot.lat, adHocSpot.lon], 13)
      const marker = L.marker([adHocSpot.lat, adHocSpot.lon], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: '<div data-testid="marker"></div>',
        }),
      })
      marker.addTo(map)
      marker.on('dragend', async (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng()
        await apiClient.PATCH('/photos/{id}', {
          params: { path: { id: photoId } },
          body: { ad_hoc_spot: { lat, lon: lng } },
        })
      })
      return () => {
        map.remove()
      }
    }

    map.setView([0, 0], 2)
    const cluster = L.markerClusterGroup()
    map.addLayer(cluster)

    const fetchPhotos = async () => {
      const bounds = map.getBounds()
      const bbox = [
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
      ].join(',')
      const { data } = shareToken
        ? await apiClient.GET('/public/shares/{token}/photos', {
            params: { path: { token: shareToken }, query: { bbox } },
          })
        : await apiClient.GET('/photos', {
            params: { query: { bbox } },
          })
      cluster.clearLayers()
      data?.items?.forEach((p: Photo) => {
        if (p.ad_hoc_spot) {
          const marker = L.marker(
            [p.ad_hoc_spot.lat, p.ad_hoc_spot.lon],
            shareToken
              ? {}
              : {
                  draggable: true,
                  icon: L.divIcon({
                    className: '',
                    html: '<div data-testid="marker"></div>',
                  }),
                },
          )
          if (!shareToken) {
            marker.on('dragend', async (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng()
              await apiClient.PATCH('/photos/{id}', {
                params: { path: { id: p.id } },
                body: { ad_hoc_spot: { lat, lon: lng } },
              })
            })
          }
          cluster.addLayer(marker)
        }
      })
    }

    fetchPhotos()
    map.on('moveend', fetchPhotos)

    return () => {
      map.off('moveend', fetchPhotos)
      map.remove()
    }
  }, [shareToken, photoId, adHocSpot])

  return <div ref={containerRef} style={{ height: '400px' }} data-testid="photo-map" />
}

