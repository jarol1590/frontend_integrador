'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    ArrowLeft, TrendingUp, Thermometer, Bell, RefreshCw,
    Droplets, FlaskConical, CheckCircle, AlertTriangle,
    Lightbulb, Flame, MapPin,
} from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useSearchParams } from 'next/navigation'
import AppLayout from '../../components/AppLayout'
import { getMiPerfil } from '../../infrastructure/dashboardApi'
import {
    getGemeloEstado, getClima, getPredicciones, getAlertas,
    sincronizarGemelo, marcarAlertaLeida,
    type FincaGemeloEstadoDto, type LecturaClimaticaDto,
    type PrediccionGemeloDto, type AlertaGemeloDto,
} from '../../infrastructure/gemeloApi'

function formatFecha(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
}

function severityColor(s: string): string {
    switch (s) {
        case 'critica': return '#e74c3c'
        case 'alta': return '#e67e22'
        case 'media': return '#f1c40f'
        default: return '#95a5a6'
    }
}

function riskColor(score: number): string {
    if (score >= 60) return '#e74c3c'
    if (score >= 30) return '#e67e22'
    return '#27ae60'
}

function RiskGauge({ score, size = 100 }: { score: number; size?: number }) {
    const pct = Math.min(score, 100)
    const color = riskColor(score)
    const radius = (size - 16) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eee" strokeWidth={12} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={12}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color }}>{score}</span>
                <span className="text-xs text-gray-400">riesgo</span>
            </div>
        </div>
    )
}

export default function GemeloPage() {
    const searchParams = useSearchParams()
    const paramFincaId = searchParams.get('fincaId')
    const paramFincaNombre = searchParams.get('fincaNombre')
    const [fincaId, setFincaId] = useState<number | null>(paramFincaId ? Number(paramFincaId) : null)
    const [fincaNombre, setFincaNombre] = useState(paramFincaNombre ?? '')
    const [estado, setEstado] = useState<FincaGemeloEstadoDto | null>(null)
    const [lecturas, setLecturas] = useState<LecturaClimaticaDto[]>([])
    const [predicciones, setPredicciones] = useState<PrediccionGemeloDto[]>([])
    const [alertas, setAlertas] = useState<AlertaGemeloDto[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const hasta = new Date()
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const desdeStr = desde.toISOString().split('T')[0]
    const hastaStr = hasta.toISOString().split('T')[0]

    const loadData = useCallback(async () => {
        try {
            let fid = fincaId
            let fnombre = fincaNombre

            if (!fid) {
                const perfil = await getMiPerfil()
                const finca = perfil.fincas?.[0]
                if (!finca) { setError('No tienes fincas asignadas.'); return }
                fid = finca.fincaId
                fnombre = finca.nombre
            }

            if (!fid) { setError('No se pudo determinar la finca.'); return }
            setFincaId(fid)
            if (fnombre) setFincaNombre(fnombre)

            const [est, clima, preds, alts] = await Promise.all([
                getGemeloEstado(fid),
                getClima(fid, desdeStr, hastaStr),
                getPredicciones(fid, 7),
                getAlertas(fid, true),
            ])
            setEstado(est)
            setLecturas(clima)
            setPredicciones(preds)
            setAlertas(alts)
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo cargar el gemelo digital.')
        } finally {
            setLoading(false)
        }
    }, [fincaId, fincaNombre])

    useEffect(() => { loadData() }, [loadData])

    const handleSync = async () => {
        if (!fincaId) return
        setSyncing(true)
        try {
            await sincronizarGemelo(fincaId)
            setSuccess('Gemelo digital actualizado correctamente.')
            await loadData()
        } catch (e: any) {
            setError(e?.message ?? 'Verifica que la finca tenga coordenadas GPS.')
        } finally {
            setSyncing(false)
        }
    }

    const handleMarcarLeida = async (alerta: AlertaGemeloDto) => {
        if (!fincaId) return
        try {
            await marcarAlertaLeida(fincaId, alerta.alertaId)
            setAlertas(prev => prev.filter(a => a.alertaId !== alerta.alertaId))
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo marcar la alerta.')
        }
    }

    const predVolumen = predicciones.find(p => p.tipoPrediccion === 'volumen_produccion')
    const predAcidificacion = predicciones.find(p => p.tipoPrediccion === 'riesgo_acidificacion')
    const climaActual = estado?.climaActual
    const thiThreshold = 72

    const chartData = lecturas.slice(-21).map(l => ({
        fecha: formatFecha(l.fecha),
        temp: Number(l.tempMedia.toFixed(1)),
        thi: l.thiMax != null ? Number(l.thiMax.toFixed(0)) : undefined,
        precip: l.precipitacionMm ?? 0,
    }))

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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Gemelo Digital</h1>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    Sincronizar
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="ml-auto font-bold">&times;</button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <CheckCircle size={16} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="ml-auto font-bold">&times;</button>
                </div>
            )}

            <h2 className="text-lg font-bold text-gray-800 text-center mb-5">{fincaNombre}</h2>

            {/* Estado general cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Riesgo global</span>
                    <RiskGauge score={estado?.scoreRiesgoGlobal ?? 0} />
                    {estado && (
                        <span className={`text-xs font-bold ${
                            estado.estadoSync === 'ok' ? 'text-green-600' :
                            estado.estadoSync === 'degradado' ? 'text-orange-500' : 'text-red-500'
                        }`}>
                            {estado.estadoSync === 'ok' ? 'Sincronizado' :
                             estado.estadoSync === 'degradado' ? 'Degradado' :
                             estado.estadoSync === 'error' ? 'Error' : 'Pendiente'}
                        </span>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Clima actual</span>
                    {climaActual ? (
                        <>
                            <span className="text-2xl font-bold text-gray-800">{climaActual.tempMedia}°C</span>
                            <span className="text-xs text-gray-500">
                                {climaActual.humedadMedia != null ? `${climaActual.humedadMedia}% HR` : '—'}
                            </span>
                            {climaActual.thiMax != null && (
                                <span className={`text-xs font-semibold ${climaActual.thiMax >= thiThreshold ? 'text-orange-500' : 'text-green-600'}`}>
                                    THI {climaActual.thiMax}
                                </span>
                            )}
                            {climaActual.diasConsecutivosCalor > 0 && (
                                <div className="flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-3 py-1 rounded-full">
                                    <Flame size={12} /> {climaActual.diasConsecutivosCalor} días
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Sincroniza para ver clima</span>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Alertas</span>
                    <span className="text-3xl font-bold text-red-500">{alertas.length}</span>
                    <span className="text-xs text-gray-500">activas</span>
                </div>
            </div>

            {/* Pronóstico 7 días */}
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-600">Pronóstico 7 días</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-1">
                    <Droplets size={22} className="text-blue-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase mt-1">Producción</span>
                    {predVolumen ? (
                        <>
                            <span className="text-3xl font-bold text-gray-800">{predVolumen.valor.toFixed(0)}</span>
                            <span className="text-xs text-gray-500">{predVolumen.unidad ?? 'L/día'}</span>
                            <span className="text-xs text-gray-400">{(predVolumen.confianza * 100).toFixed(0)}% confianza</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic text-sm">—</span>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-1">
                    <FlaskConical size={22} className={predAcidificacion && predAcidificacion.valor > 50 ? 'text-red-500' : 'text-green-600'} />
                    <span className="text-xs font-bold text-gray-500 uppercase mt-1">Riesgo acidif.</span>
                    {predAcidificacion ? (
                        <>
                            <span className="text-3xl font-bold" style={{ color: riskColor(predAcidificacion.valor) }}>
                                {predAcidificacion.valor.toFixed(0)}
                            </span>
                            <span className="text-xs text-gray-500">{predAcidificacion.unidad ?? '/100'}</span>
                            <span className="text-xs text-gray-400">{(predAcidificacion.confianza * 100).toFixed(0)}% confianza</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic text-sm">—</span>
                    )}
                </div>
            </div>

            {/* Gráfico climático */}
            <div className="flex items-center gap-2 mb-3">
                <Thermometer size={18} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-600">Temperatura y precipitación (últimos 21 días)</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
                {chartData.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 10, fill: '#888' }} />
                                <Tooltip />
                                <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#e74c3c" strokeWidth={2} dot={{ r: 3 }} name="Temp. °C" />
                                <Line yAxisId="temp" type="monotone" dataKey="thi" stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} name="THI" strokeDasharray="4 4" />
                                <Bar yAxisId="precip" dataKey="precip" fill="rgba(52,152,219,0.3)" name="Precip. mm" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>Temp. °C</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span>THI</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-blue-300/50 border border-blue-300" />
                                <span>Precip. mm</span>
                            </div>
                            <span className="text-orange-500 ml-auto">Umbral calor {thiThreshold}</span>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-sm text-gray-400 italic py-8">Sincroniza para ver datos climáticos</p>
                )}
            </div>

            {/* Alertas activas */}
            <div className="flex items-center gap-2 mb-3">
                <Bell size={18} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-600">Alertas activas</h3>
            </div>
            {alertas.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-2">
                    <CheckCircle size={32} className="text-green-600" />
                    <p className="text-sm text-gray-400">No hay alertas activas</p>
                </div>
            ) : (
                <div className="space-y-3 mb-6">
                    {alertas.map(a => (
                        <div key={a.alertaId} className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded"
                                    style={{ backgroundColor: severityColor(a.severidad) }}
                                >
                                    {a.severidad.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500 capitalize flex-1">
                                    {a.tipoAlerta.replace(/_/g, ' ')}
                                </span>
                                <button onClick={() => handleMarcarLeida(a)} title="Marcar como leída">
                                    <CheckCircle size={20} className="text-green-600 hover:text-green-700" />
                                </button>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{a.titulo}</p>
                            <p className="text-xs text-gray-600 mt-1">{a.mensaje}</p>
                            {a.recomendacion && (
                                <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-xl mt-2">
                                    <Lightbulb size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-yellow-800">{a.recomendacion}</p>
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400 text-right mt-2">{formatFecha(a.creadaUtc)}</p>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    )
}
