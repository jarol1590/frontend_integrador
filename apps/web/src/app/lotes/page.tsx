'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, X } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'
import { getMiPerfil } from '../../infrastructure/dashboardApi'
import { getLotesByFinca, LoteDto } from '../../infrastructure/ordenosApi'

function status(lote: LoteDto | null): { label: string; color: string } {
    if (!lote) return { label: 'Desconocido', color: '#999' }
    if (lote.centroAcopioId == null && lote.transporteId == null)
        return { label: 'Abierto', color: '#6eaaff' }
    if (lote.transporteFechaHoraEntrada != null)
        return { label: 'Entregado', color: '#27ae60' }
    return { label: 'En tránsito', color: '#e67e22' }
}

export default function Lotes() {
    const router = useRouter()
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null)
    const [respModal, setRespModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    const loadLotes = useCallback(async () => {
        setLoading(true)
        try {
            const p = await getMiPerfil()
            const finca = p.fincas?.[0]
            if (finca) {
                const all = await getLotesByFinca(finca.fincaId)
                setLotes(all)
            }
        } catch {
            setRespModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los lotes' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadLotes() }, [loadLotes])

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-white/70 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">Mis lotes</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={28} className="animate-spin text-blue-400" />
                    </div>
                ) : lotes.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-10">No hay lotes registrados</p>
                ) : (
                    <div className="space-y-3">
                        {lotes.map(item => {
                            const s = status(item)
                            return (
                                <button
                                    key={item.loteId}
                                    onClick={() => setSelectedLote(item)}
                                    className="w-full bg-white/97 rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow text-left"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{item.codigo ?? `Lote #${item.loteId}`}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.volumenCapturadoLitros} L</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white px-2.5 py-1 rounded-xl" style={{ backgroundColor: s.color }}>
                                            {s.label}
                                        </span>
                                        {s.label === 'Abierto' && (
                                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                <span className="text-blue-500 text-[10px] font-bold">QR</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal detalle lote */}
            {selectedLote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedLote(null)}>
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedLote(null)} className="self-end p-1 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-400" />
                        </button>
                        <p className="text-base font-bold text-gray-800">{selectedLote.codigo ?? `Lote #${selectedLote.loteId}`}</p>
                        <p className="text-sm text-gray-500">{selectedLote.volumenCapturadoLitros} L</p>
                        <span className="text-xs font-bold text-white px-3 py-1 rounded-xl" style={{ backgroundColor: status(selectedLote).color }}>
                            {status(selectedLote).label}
                        </span>
                        <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                            <span className="text-gray-400 text-sm">QR</span>
                        </div>
                        <p className="text-[11px] text-gray-400 text-center">Comparte este QR para registrar el transporte</p>
                        <button className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors">
                            Compartir QR
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
