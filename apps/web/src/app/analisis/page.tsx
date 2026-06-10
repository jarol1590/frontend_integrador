'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, FlaskConical, CheckCircle, Clock, Plus,
    ChevronRight, Building2, AlertCircle,
} from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import {
    getLotesByCentro, getMuestrasByLote, createMuestra,
    createAnalisis, createResultado,
    type LoteDto, type MuestraConEstadoDto,
} from '../../infrastructure/analisisApi'
import {
    getParametrosByCentro,
    type ParametroCalidadDto,
} from '../../infrastructure/parametrosApi'

type Step = 'lotes' | 'muestras' | 'form'

export default function AnalisisPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('lotes')
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [parametros, setParametros] = useState<ParametroCalidadDto[]>([])
    const [centroId, setCentroId] = useState<number | null>(null)
    const [usuarioId, setUsuarioId] = useState<number | null>(null)
    const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null)
    const [muestras, setMuestras] = useState<MuestraConEstadoDto[]>([])
    const [selectedMuestra, setSelectedMuestra] = useState<MuestraConEstadoDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [muestraLoading, setMuestraLoading] = useState(false)
    const [observaciones, setObservaciones] = useState('')
    const [valores, setValores] = useState<Record<number, string>>({})
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const userJson = localStorage.getItem('usuario')
            if (!userJson) return
            const user = JSON.parse(userJson)
            const id = user.centroAcopioId
            const uid = user.id ?? user.usuarioId
            if (!id) {
                setError('No tienes un centro de acopio asignado.')
                return
            }
            setCentroId(id)
            setUsuarioId(uid)

            const [lotesData, paramsData] = await Promise.all([
                getLotesByCentro(id),
                getParametrosByCentro(id),
            ])
            setLotes(lotesData)
            setParametros(paramsData)
        } catch {
            setError('No se pudieron cargar los datos.')
        } finally {
            setLoading(false)
        }
    }

    const selectLote = async (lote: LoteDto) => {
        setSelectedLote(lote)
        setSelectedMuestra(null)
        setMuestraLoading(true)
        try {
            const m = await getMuestrasByLote(lote.loteId)
            setMuestras(m)
            setStep('muestras')
        } catch {
            setMuestras([])
            setStep('muestras')
        } finally {
            setMuestraLoading(false)
        }
    }

    const handleNuevaMuestra = async () => {
        if (!selectedLote || !usuarioId) return
        setMuestraLoading(true)
        try {
            const m = await createMuestra(selectedLote.loteId, usuarioId)
            setMuestras(prev => [{
                muestraId: m.muestraId,
                loteId: m.loteId,
                tecnicoPorUsuarioId: m.tecnicoPorUsuarioId,
                fechaHoraToma: m.fechaHoraToma,
                tieneAnalisis: false,
            }, ...prev])
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo crear la muestra.')
        } finally {
            setMuestraLoading(false)
        }
    }

    const selectMuestra = (m: MuestraConEstadoDto) => {
        setSelectedMuestra(m)
        setValores({})
        setObservaciones('')
        setStep('form')
    }

    const handleSubmit = async () => {
        if (!selectedLote || !usuarioId || !centroId || !selectedMuestra) return
        if (parametros.length === 0) {
            setError('No hay parámetros definidos para este centro.')
            return
        }

        const missing = parametros.filter((p) => !valores[p.parametroId] && valores[p.parametroId] !== '0')
        if (missing.length > 0) {
            setError(`Faltan valores para: ${missing.map((p) => p.nombre).join(', ')}`)
            return
        }

        setSaving(true)
        setError('')
        try {
            const analisis = await createAnalisis(selectedMuestra.muestraId, observaciones)

            for (const p of parametros) {
                await createResultado(
                    analisis.analisisId,
                    p.parametroId,
                    Number(valores[p.parametroId]),
                    null,
                )
            }

            setSuccess('Análisis registrado correctamente.')
            setTimeout(() => router.push('/analisis'), 1500)
        } catch (error: any) {
            setError(error.message ?? 'No se pudo registrar el análisis.')
            setSaving(false)
        }
    }

    const pendientes = muestras.filter(m => !m.tieneAnalisis)
    const completadas = muestras.filter(m => m.tieneAnalisis)

    const groupedLotes: Record<string, LoteDto[]> = {}
    for (const l of lotes) {
        const key = l.fincaNombre ?? 'Sin finca'
        if (!groupedLotes[key]) groupedLotes[key] = []
        groupedLotes[key].push(l)
    }

    const steps = [
        { key: 'lotes', label: 'Lote' },
        { key: 'muestras', label: 'Muestra' },
        { key: 'form', label: 'Resultados' },
    ]
    const currentStepIdx = steps.findIndex(s => s.key === step)

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === 'muestras') { setStep('lotes'); setSelectedLote(null); setMuestras([]) }
                            else if (step === 'form') { setStep('muestras'); setSelectedMuestra(null) }
                            else router.push('/dashboard-centro')
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">
                        {step === 'lotes' ? 'Seleccionar lote' : step === 'muestras' ? 'Muestras' : 'Nuevo análisis'}
                    </h1>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
                {steps.map((s, idx) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx <= currentStepIdx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {idx + 1}
                        </div>
                        <span className={`text-sm ${idx <= currentStepIdx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            {s.label}
                        </span>
                        {idx < steps.length - 1 && <ChevronRight size={16} className="text-gray-300" />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="ml-auto font-bold">&times;</button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <CheckCircle size={16} />
                    <span>{success}</span>
                </div>
            )}

            {/* Step 1: Select lote */}
            {step === 'lotes' && (
                <div className="space-y-4">
                    {lotes.length === 0 ? (
                        <div className="text-center py-16">
                            <FlaskConical size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-400">No hay lotes disponibles con transporte completado.</p>
                        </div>
                    ) : (
                        Object.entries(groupedLotes).map(([finca, lots]) => (
                            <div key={finca}>
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-2">
                                    <Building2 size={16} />
                                    {finca}
                                </div>
                                <div className="space-y-2">
                                    {lots.map((l) => (
                                        <button
                                            key={l.loteId}
                                            onClick={() => selectLote(l)}
                                            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                                        >
                                            <p className="font-semibold text-gray-800">{l.codigo ?? `Lote #${l.loteId}`}</p>
                                            <p className="text-sm text-gray-500 mt-1">Volumen: {l.volumenCapturadoLitros} L</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Step 2: Select muestra */}
            {step === 'muestras' && (
                <div>
                    <button
                        onClick={handleNuevaMuestra}
                        disabled={muestraLoading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 mb-4"
                    >
                        {muestraLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <><Plus size={18} /> Nueva muestra</>
                        )}
                    </button>

                    <div className="space-y-3">
                        {muestras.length === 0 && !muestraLoading && (
                            <div className="text-center py-16">
                                <FlaskConical size={48} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-400">No hay muestras para este lote. Crea una nueva.</p>
                            </div>
                        )}

                        {pendientes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Pendientes de análisis</h3>
                                <div className="space-y-2">
                                    {pendientes.map(m => (
                                        <button
                                            key={m.muestraId}
                                            onClick={() => selectMuestra(m)}
                                            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center hover:border-blue-300 transition-all"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">Muestra #{m.muestraId}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(m.fechaHoraToma).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mr-2">
                                                Pendiente
                                            </span>
                                            <ChevronRight size={18} className="text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {completadas.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Analizadas</h3>
                                <div className="space-y-2">
                                    {completadas.map(m => (
                                        <div
                                            key={m.muestraId}
                                            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">Muestra #{m.muestraId}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(m.fechaHoraToma).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                Analizada
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Form */}
            {step === 'form' && (
                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">
                            {selectedLote?.codigo ?? `Lote #${selectedLote?.loteId}`} — Muestra #{selectedMuestra?.muestraId}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Ingresa los valores del análisis</p>
                    </div>

                    {parametros.map((p) => (
                        <div key={p.parametroId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {p.nombre}
                                {p.unidad && <span className="text-gray-400 font-normal ml-1">({p.unidad})</span>}
                            </label>
                            {p.descripcion && (
                                <p className="text-xs text-gray-400 italic mb-1">{p.descripcion}</p>
                            )}
                            <input
                                type="number"
                                step="any"
                                value={valores[p.parametroId] ?? ''}
                                onChange={(e) => setValores(prev => ({ ...prev, [p.parametroId]: e.target.value }))}
                                placeholder={p.valorMinimo != null && p.valorMaximo != null
                                    ? `Óptimo: ${p.valorMinimo} - ${p.valorMaximo}`
                                    : 'Ingresa el valor'}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Notas adicionales sobre el análisis..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</>
                        ) : (
                            <><CheckCircle size={18} /> Registrar análisis</>
                        )}
                    </button>
                </div>
            )}
        </AppLayout>
    )
}
