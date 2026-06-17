'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, ChevronLeft } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'
import QRCode from '../../components/QRCode'
import { getMiPerfil, ProductorPerfil } from '../../infrastructure/dashboardApi'
import { createOrdeno, createLote, getLotesByFinca, getOrdenosByFinca, LoteDto, OrdenoDto } from '../../infrastructure/ordenosApi'

export default function Ordenos() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<ProductorPerfil | null>(null)
    const [ordenos, setOrdenos] = useState<OrdenoDto[]>([])
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [volumen, setVolumen] = useState('')
    const [creating, setCreating] = useState(false)
    const [respModal, setRespModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const p = await getMiPerfil()
            setPerfil(p)
            const finca = p.fincas?.[0]
            if (finca) {
                const [ords, lots] = await Promise.all([
                    getOrdenosByFinca(finca.fincaId),
                    getLotesByFinca(finca.fincaId),
                ])
                setOrdenos(ords)
                setLotes(lots)
            }
        } catch {
            setRespModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los datos' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const finca = perfil?.fincas?.[0]

    const handleCrearOrdeneo = async () => {
        if (!volumen || !finca) return
        setCreating(true)
        try {
            const ordeno = await createOrdeno(finca.fincaId, parseFloat(volumen))
            await createLote(ordeno.ordenoId, parseFloat(volumen))
            setVolumen('')
            setShowCreate(false)
            await loadData()
        } catch (e: any) {
            const msg = e?.message ?? 'Error al crear el ordeño'
            setRespModal({ visible: true, type: 'error', title: 'Error', message: msg })
        } finally {
            setCreating(false)
        }
    }

    const handleCrearLoteParaOrdeno = async (ordenoId: number, volumenLitros: number) => {
        try {
            await createLote(ordenoId, volumenLitros)
            await loadData()
        } catch (e: any) {
            const msg = e?.message ?? 'Error al crear el lote'
            setRespModal({ visible: true, type: 'error', title: 'Error', message: msg })
        }
    }

    const ordenoConLote = (ordenoId: number) => lotes.find(l => l.ordenoId === ordenoId)

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 bg-white/70 rounded-full hover:bg-gray-100 transition-colors">
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-800">{showCreate ? 'Nuevo ordeño' : 'Mis ordeños'}</h1>
                    </div>
                    {!showCreate && (
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors">
                            <Plus size={18} />
                            Nuevo ordeño
                        </button>
                    )}
                </div>

                {showCreate ? (
                    <div className="bg-white/97 rounded-2xl p-5 space-y-4">
                        <h2 className="text-sm font-bold text-gray-700">Registrar ordeño</h2>
                        <p className="text-xs text-gray-500 font-semibold">Finca: {finca?.nombre ?? '---'}</p>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold mb-1">Volumen capturado (litros)</p>
                            <input
                                type="number"
                                step="0.1"
                                value={volumen}
                                onChange={e => setVolumen(e.target.value)}
                                placeholder="Ej: 150.5"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        <button
                            onClick={handleCrearOrdeneo}
                            disabled={!volumen || creating}
                            className={`w-full py-3 rounded-xl font-bold text-sm text-white ${volumen && !creating ? 'bg-blue-400 hover:bg-blue-500' : 'bg-gray-300'} transition-colors`}
                        >
                            {creating ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Registrar ordeño'}
                        </button>
                        <button onClick={() => setShowCreate(false)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1">
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 size={28} className="animate-spin text-blue-400" />
                            </div>
                        ) : ordenos.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-10">No hay ordeños registrados</p>
                        ) : (
                            <div className="space-y-3">
                                {ordenos.map(item => {
                                    const lote = ordenoConLote(item.ordenoId)
                                    return (
                                        <div key={item.ordenoId} className="bg-white/97 rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.codigo ?? `Ordeño #${item.ordenoId}`}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(item.fechaHoraInicio).toLocaleDateString('es-CO', {
                                                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.volumenLitros} L</p>
                                            </div>
                                            {lote ? (
                                                <QRCode value={JSON.stringify({ idLote: lote.loteId, idFinca: finca?.fincaId })} size={36} />
                                            ) : (
                                                <button
                                                    onClick={() => handleCrearLoteParaOrdeno(item.ordenoId, item.volumenLitros)}
                                                    className="flex items-center gap-1 text-green-600 text-xs font-semibold border border-green-600 rounded-xl px-3 py-1.5 hover:bg-green-50 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    Crear lote
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

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
