import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'

interface MapSearchControlProps {
  onLocationSelect: (position: [number, number]) => void
}

export default function MapSearchControl({ onLocationSelect }: MapSearchControlProps) {
  const map = useMap()

  useEffect(() => {
    const provider = new OpenStreetMapProvider()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Cari alamat di peta...',
    })

    map.addControl(searchControl)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLocationFound = (e: any) => {
      onLocationSelect([e.location.y, e.location.x])
    }

    map.on('geosearch/showlocation', handleLocationFound)

    return () => {
      map.removeControl(searchControl)
      map.off('geosearch/showlocation', handleLocationFound)
    }
  }, [map, onLocationSelect])

  return null
}
