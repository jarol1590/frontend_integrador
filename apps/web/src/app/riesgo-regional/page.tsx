'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, AlertTriangle, RefreshCw, Crosshair, Flame, Thermometer } from 'lucide-react'
import dynamic from 'next/dynamic'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'
import { getRiesgoRegional, type CentroAcopioRiesgoRegionalDto, type RiesgoRegionalFincaDto } from '../../infrastructure/gemeloApi'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

import 'leaflet/dist/leaflet.css'

function riskColor(score: number): string {
    if (score >= 60) return '#e74c3c'
    if (score >= 30) return '#e67e22'
    return '#27ae60'
}

function riskRadius(score: number): number {
    if (score >= 60) return 18
    if (score >= 30) return 14
    return 10
}

function FincaMarker({ f }: { f: RiesgoRegionalFincaDto }) {
    const router = useRouter()
    return (
        <CircleMarker
            center={[f.latitud!, f.longitud!]}
            radius={riskRadius(f.scoreRiesgoGlobal)}
            pathOptions={{
                color: riskColor(f.scoreRiesgoGlobal),
                fillColor: riskColor(f.scoreRiesgoGlobal),
                fillOpacity: 0.7,
                weight: 2,
            }}
        >
            <Popup>
                <div className="min-w-[200px]">
                    <p className="font-bold text-sm mb-1">{f.fincaNombre}</p>
                    <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <MapPin size={12} /> {f.municipioNombre}
                        </div>
                        <div className="flex items-center gap-1" style={{ color: riskColor(f.scoreRiesgoGlobal) }}>
                            <Flame size={12} /> Riesgo: <strong>{f.scoreRiesgoGlobal}</strong>
                        </div>
                        {f.tempMediaReciente != null && (
                            <div className="flex items-center gap-1">
                                <Thermometer size={12} /> {f.tempMediaReciente}°C
                            </div>
                        )}
                        {f.alertasActivas > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                                <AlertTriangle size={12} />
                                {f.alertasActivas} alerta{f.alertasActivas !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            router.push(`/gemelo?fincaId=${f.fincaId}&fincaNombre=${encodeURIComponent(f.fincaNombre)}`)
                        }}
                        className="mt-2 w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors"
                    >
                        Ver gemelo digital →
                    </button>
                </div>
            </Popup>
        </CircleMarker>
    )
}

function MapView({ fincas, center }: { fincas: RiesgoRegionalFincaDto[]; center: [number, number] }) {
    return (
        <MapContainer
            center={center}
            zoom={12}
            className="w-full h-full rounded-2xl"
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {fincas.map(f => (
                f.latitud != null && f.longitud != null ? (
                    <FincaMarker key={f.fincaId} f={f} />
                ) : null
            ))}
        </MapContainer>
    )
}

export default function RiesgoRegional() {
    const router = useRouter()
    const [data, setData] = useState<CentroAcopioRiesgoRegionalDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedFinca, setSelectedFinca] = useState<RiesgoRegionalFincaDto | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [modal, setModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')
            const userJson = localStorage.getItem('usuario')
            if (!userJson) { router.push('/login'); return }
            const user = JSON.parse(userJson)
            if (!user.centroAcopioId) { setError('No tienes un centro de acopio asignado.'); return }
            const res = await getRiesgoRegional(user.centroAcopioId)
            setData(res)
            setMapReady(true)
        } catch (e: any) {
            const msg = e?.message ?? 'Error al cargar riesgo regional'
            setError(msg)
            setModal({ visible: true, type: 'error', title: 'Error', message: msg })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const fincasConCoords = data?.fincas.filter(f => f.latitud != null && f.longitud != null) ?? []

    const mapCenter: [number, number] = (() => {
        if (fincasConCoords.length > 0) {
            const avgLat = fincasConCoords.reduce((s, f) => s + f.latitud!, 0) / fincasConCoords.length
            const avgLng = fincasConCoords.reduce((s, f) => s + f.longitud!, 0) / fincasConCoords.length
            return [avgLat, avgLng]
        }
        return [4.5709, -74.2973] // Colombia center
    })()

    const totalAlertas = data?.fincas.reduce((s, f) => s + f.alertasActivas, 0) ?? 0

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Riesgo Regional</h1>
                        <p className="text-xs text-gray-400">Mapa de calor por fincas — {data?.centroAcopioNombre ?? ''}</p>
                    </div>
                    <button onClick={loadData} disabled={loading}
                        className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <RefreshCw size={18} className={`text-blue-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Stats bar */}
                {data && (
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-white/97 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                            <Flame size={16} className="text-orange-500" />
                            <span className="text-sm text-gray-600">Score: <strong style={{ color: riskColor(data.scoreRiesgoPromedio) }}>{data.scoreRiesgoPromedio}</strong></span>
                        </div>
                        <div className="bg-white/97 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />
                            <span className="text-sm text-gray-600">{data.fincas.length} fincas</span>
                        </div>
                        <div className="bg-white/97 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-sm text-gray-600">{totalAlertas} alertas</span>
                        </div>
                        {fincasConCoords.length < data.fincas.length && (
                            <div className="bg-yellow-50 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                                <Crosshair size={16} className="text-yellow-600" />
                                <span className="text-sm text-yellow-700">{data.fincas.length - fincasConCoords.length} sin coordenadas</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Map */}
                <div className="bg-white/97 rounded-2xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <AlertTriangle size={48} className="text-red-400" />
                            <p className="text-sm text-gray-500">{error}</p>
                            <button onClick={loadData}
                                className="px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                                Reintentar
                            </button>
                        </div>
                    ) : mapReady ? (
                        <MapView fincas={fincasConCoords} center={mapCenter} />
                    ) : null}
                </div>

                {/* Fincas list under map */}
                {data && (
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-2">Fincas</p>
                        <div className="flex flex-wrap gap-2">
                            {data.fincas.map(f => (
                                <button
                                    key={f.fincaId}
                                    onClick={() => router.push(`/gemelo?fincaId=${f.fincaId}&fincaNombre=${encodeURIComponent(f.fincaNombre)}`)}
                                    className="bg-white/97 rounded-xl px-3 py-2 text-left hover:shadow-md transition-shadow flex items-center gap-2 border"
                                    style={{ borderColor: riskColor(f.scoreRiesgoGlobal) + '40' }}
                                >
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: riskColor(f.scoreRiesgoGlobal) }} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">{f.fincaNombre}</p>
                                        <p className="text-[10px] text-gray-400">{f.municipioNombre} · {f.scoreRiesgoGlobal}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ResponseModal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal(prev => ({ ...prev, visible: false }))}
            />
        </AppLayout>
    )
}
