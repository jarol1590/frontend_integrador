'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, CheckCircle, X } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'
import { getTransportesByCentro, completarTransporte, TransporteDto } from '../../infrastructure/ordenosApi'

const TIMEZONE = 'America/Bogota'

function formatFecha(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleString('es-CO', { timeZone: TIMEZONE })
}

export default function Transportes() {
    const router = useRouter()
    const [transportes, setTransportes] = useState<TransporteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [selectedTransporte, setSelectedTransporte] = useState<TransporteDto | null>(null)
    const [respModal, setRespModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    const loadTransportes = useCallback(async () => {
        setLoading(true)
        try {
            const userJson = localStorage.getItem('usuario')
            const user = userJson ? JSON.parse(userJson) : null
            const centroAcopioId = user?.centroAcopioId
            if (!centroAcopioId) {
                setRespModal({ visible: true, type: 'error', title: 'Error', message: 'No tienes un centro de acopio asignado' })
                setTransportes([])
                return
            }
            const data = await getTransportesByCentro(centroAcopioId)
            setTransportes(data)
        } catch {
            setRespModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los transportes' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadTransportes() }, [loadTransportes])

    const abiertos = transportes.filter(t => !t.fechaHoraEntrada)
    const completados = transportes.filter(t => t.fechaHoraEntrada)

    const handleCompletar = async () => {
        if (!selectedTransporte) return
        setEditing(true)
        try {
            await completarTransporte(selectedTransporte.transporteId)
            setSelectedTransporte(null)
            setRespModal({ visible: true, type: 'success', title: 'Éxito', message: 'Llegada registrada correctamente' })
            await loadTransportes()
        } catch (e: any) {
            const msg = e?.message ?? 'Error al registrar la llegada'
            setRespModal({ visible: true, type: 'error', title: 'Error', message: msg })
        } finally {
            setEditing(false)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-white/70 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">Transportes</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={28} className="animate-spin text-blue-400" />
                    </div>
                ) : (
                    <>
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-3">Abiertos</p>
                            {abiertos.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-3">Sin transportes abiertos</p>
                            ) : (
                                <div className="space-y-2">
                                    {abiertos.map(item => (
                                        <button
                                            key={item.transporteId}
                                            onClick={() => setSelectedTransporte(item)}
                                            className="w-full bg-white/97 rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.placaVehiculo}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Salida: {formatFecha(item.fechaHoraSalida)}
                                                    {item.temperaturaInicio != null ? ` | ${item.temperaturaInicio}°C` : ''}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold text-white bg-orange-500 px-2.5 py-1 rounded-xl">
                                                En tránsito
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-3">Completados</p>
                            {completados.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-3">Sin transportes completados</p>
                            ) : (
                                <div className="space-y-2">
                                    {completados.map(item => (
                                        <div key={item.transporteId} className="bg-white/97 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.placaVehiculo}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Salida: {formatFecha(item.fechaHoraSalida)}
                                                    {item.temperaturaInicio != null ? ` | ${item.temperaturaInicio}°C` : ''}
                                                </p>
                                                {item.fechaHoraEntrada && (
                                                    <p className="text-xs text-gray-400">Entrada: {formatFecha(item.fechaHoraEntrada)}</p>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-white bg-green-500 px-2.5 py-1 rounded-xl">
                                                Completado
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal completar transporte */}
            {selectedTransporte && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedTransporte(null)}>
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedTransporte(null)} className="self-end p-1 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-400" />
                        </button>
                        <p className="text-base font-bold text-gray-800">Registrar llegada</p>
                        <p className="text-sm text-gray-500">Transporte: {selectedTransporte.placaVehiculo}</p>
                        <p className="text-xs text-gray-400">Salida: {formatFecha(selectedTransporte.fechaHoraSalida)}</p>
                        <button
                            onClick={handleCompletar}
                            disabled={editing}
                            className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white transition-colors ${editing ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editing ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Registrar llegada
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <ResponseModal
                visible={respModal.visible}
                type={respModal.type}
                title={respModal.title}
                message={respModal.message}
                onClose={() => setRespModal(prev => ({ ...prev, visible: false }))}
            />
        </AppLayout>
    )
}
