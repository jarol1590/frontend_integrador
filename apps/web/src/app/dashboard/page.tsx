'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    User, Bell, QrCode, Droplets, Package, Sigma,
    Plus, Trash2, ChevronLeft, ChevronRight, MessageCircle,
    Loader2,
} from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'
import ParametroCircularChart from '../../components/ParametroCircularChart'
import ChatModal from '../../components/ChatModal'
import { getMiPerfil, getAnalisisPorFinca, AnalisisPorFinca } from '../../infrastructure/dashboardApi'

type CalendarEvent = {
    id: string
    date: string
    type: string
    note: string
}

const EVENT_OPTIONS = [
    { label: 'Ordeño', value: 'Ordeño' },
    { label: 'Vacunación', value: 'Vacunación' },
    { label: 'Alimentación', value: 'Alimentación' },
    { label: 'Análisis de calidad', value: 'Análisis de calidad' },
    { label: 'Recolección', value: 'Recolección' },
    { label: 'Mantenimiento', value: 'Mantenimiento' },
    { label: 'Visita veterinaria', value: 'Visita veterinaria' },
    { label: 'Entrega de insumos', value: 'Entrega de insumos' },
    { label: 'Otra tarea', value: 'Otra tarea' },
]

const STORAGE_KEY = 'lacticontrol_events'
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const TIMEZONE = 'America/Bogota'

function getDayOfWeek(year: number, month: number, day: number): number {
    return new Date(year, month, day).getDay()
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

export default function Dashboard() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [userRole, setUserRole] = useState('productor')
    const [analisisList, setAnalisisList] = useState<AnalisisPorFinca[]>([])
    const [loadingAnalisis, setLoadingAnalisis] = useState(true)
    const [chatVisible, setChatVisible] = useState(false)

    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [selectedDate, setSelectedDate] = useState('')
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedType, setSelectedType] = useState('')
    const [note, setNote] = useState('')
    const [calMonth, setCalMonth] = useState(new Date().getMonth())
    const [calYear, setCalYear] = useState(new Date().getFullYear())

    const [respModal, setRespModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userJson = localStorage.getItem('usuario')
                const token = localStorage.getItem('token')
                if (userJson) {
                    const user = JSON.parse(userJson)
                    setUserName(user.email ?? '')
                    const roleMap: Record<string, string> = {
                        'Administrador': 'administrador',
                        'Centro de Acopio': 'centro_acopio',
                        'Productor': 'productor',
                        'Trabajador Centro de acopio': 'trabajador_centro_acopio',
                    }
                    setUserRole(roleMap[user.rolNombre] ?? 'productor')
                    if (user.usuarioId && token) {
                        try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/public/${user.usuarioId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            })
                            const json = await res.json()
                            const r = json.response ?? json
                            if (r?.productor?.nombre) {
                                setUserName(r.productor.nombre)
                            }
                        } catch { }
                    }
                }
                const perfil = await getMiPerfil()
                if (perfil.tipoUsuario?.toLowerCase() !== 'productor') {
                    setLoadingAnalisis(false)
                    return
                }
                setUserName(perfil.productor.nombre)
                const todo = perfil.fincas.map(f => getAnalisisPorFinca(f.fincaId))
                const resultados = await Promise.all(todo)
                const flat = resultados.flat()
                flat.sort((a, b) => new Date(b.fechaAnalisis).getTime() - new Date(a.fechaAnalisis).getTime())
                setAnalisisList(flat)
            } catch {
                setRespModal({ visible: true, type: 'error', title: 'Error', message: 'Error cargando datos del usuario' })
            } finally {
                setLoadingAnalisis(false)
            }
        }
        loadUser()
    }, [])

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) setEvents(JSON.parse(stored))
        } catch { }
    }, [])

    const saveEvents = (newEvents: CalendarEvent[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
        } catch { }
    }

    const handleAddEvent = () => {
        if (!selectedType) return
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            date: selectedDate,
            type: selectedType,
            note: note.trim(),
        }
        const updated = [...events, newEvent]
        setEvents(updated)
        saveEvents(updated)
        setModalVisible(false)
        setSelectedType('')
        setNote('')
    }

    const handleDeleteEvent = (id: string) => {
        const updated = events.filter(e => e.id !== id)
        setEvents(updated)
        saveEvents(updated)
    }

    const eventsOfDay = events.filter(e => e.date === selectedDate)

    const markedDates = new Set(events.map(e => e.date))

    const calToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

    const renderCalendar = () => {
        const dim = daysInMonth(calYear, calMonth)
        const startDow = getDayOfWeek(calYear, calMonth, 1)
        const cells: React.ReactNode[] = []
        for (let i = 0; i < startDow; i++) {
            cells.push(<div key={`empty-${i}`} className="p-1" />)
        }
        for (let d = 1; d <= dim; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === calToday
            const hasEvent = markedDates.has(dateStr)
            cells.push(
                <button
                    key={d}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                        p-1 w-8 h-8 text-xs rounded-full flex items-center justify-center
                        ${isSelected ? 'bg-blue-400 text-white font-bold' : isToday ? 'text-blue-500 font-bold' : 'text-gray-700'}
                        ${hasEvent && !isSelected ? 'after:absolute after:w-1 after:h-1 after:bg-blue-400 after:rounded-full after:mt-3' : ''}
                        relative hover:bg-gray-100 transition-colors
                    `}
                >
                    {d}
                </button>
            )
        }
        return cells
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Buenos días!</p>
                            <p className="text-xs text-gray-500">{userName || 'Productor'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <QrCode size={18} className="text-gray-500" />
                        </button>
                        <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <Bell size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Calidad de leche */}
                {userRole === 'productor' && (
                    <>
                        {loadingAnalisis ? (
                            <div className="bg-white/97 rounded-2xl p-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Calidad de leche</h3>
                                <div className="flex justify-center py-5">
                                    <Loader2 size={24} className="animate-spin text-blue-400" />
                                </div>
                            </div>
                        ) : analisisList.length === 0 ? (
                            <div className="bg-white/97 rounded-2xl p-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Calidad de leche</h3>
                                <p className="text-sm text-gray-400 text-center py-5">Aún no hay análisis registrados</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white/97 rounded-2xl p-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Último análisis</h3>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {new Date(analisisList[0].fechaAnalisis).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE })} — {analisisList[0].fincaNombre} (Lote #{analisisList[0].loteId})
                                    </p>
                                    <div className="space-y-2">
                                        {analisisList[0].resultados.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${r.dentroDeRango ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-xs text-gray-700 flex-1">{r.parametroNombre}</span>
                                                <span className="text-xs font-bold text-gray-700">{r.valorResultado}{r.unidad ? ` ${r.unidad}` : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/97 rounded-2xl p-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Parámetros evaluados</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {analisisList[0].resultados.map((r, i) => (
                                            <ParametroCircularChart
                                                key={i}
                                                parametroNombre={r.parametroNombre}
                                                unidad={r.unidad}
                                                valorResultado={r.valorResultado}
                                                valorMinimo={r.valorMinimo}
                                                valorMaximo={r.valorMaximo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Acciones por rol */}
                {userRole === 'centro_acopio' && (
                    <button onClick={() => router.push('/parametros')} className="w-full bg-white/97 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-lg font-bold">F</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Gestionar parámetros</p>
                            <p className="text-xs text-gray-400">Agregar o quitar campos del formulario de calidad</p>
                        </div>
                    </button>
                )}
                {(userRole === 'trabajador_centro_acopio') && (
                    <button onClick={() => router.push('/analisis')} className="w-full bg-white/97 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-lg font-bold">A</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Nuevo análisis de calidad</p>
                            <p className="text-xs text-gray-400">Registrar valores de parámetros para un lote</p>
                        </div>
                    </button>
                )}

                {/* Calendario */}
                <div className="bg-white/97 rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Calendario de actividades</h3>

                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }} className="p-1 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={18} className="text-gray-500" />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">{MONTHS[calMonth]} {calYear}</span>
                        <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }} className="p-1 hover:bg-gray-100 rounded-full">
                            <ChevronRight size={18} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-0 text-center mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0 text-center">
                        {renderCalendar()}
                    </div>

                    {/* Eventos del día */}
                    {selectedDate && (
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700">{selectedDate}</span>
                                <button onClick={() => setModalVisible(true)} className="flex items-center gap-1 bg-blue-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-blue-500 transition-colors">
                                    <Plus size={14} />
                                    Agregar
                                </button>
                            </div>
                            {eventsOfDay.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">No hay actividades para este día</p>
                            ) : (
                                eventsOfDay.map(ev => (
                                    <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">{ev.type}</p>
                                            {ev.note && <p className="text-[11px] text-gray-400">{ev.note}</p>}
                                        </div>
                                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 hover:bg-gray-200 rounded-full">
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Botones de acción */}
                {userRole === 'productor' && (
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={() => router.push('/ordenos')} className="flex items-center gap-2 bg-blue-400 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors">
                            <Droplets size={18} />
                            Ordeños
                        </button>
                        <button onClick={() => router.push('/lotes')} className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors">
                            <Package size={18} />
                            Lotes
                        </button>
                        <button onClick={() => router.push('/gemelo')} className="flex items-center gap-2 bg-purple-500 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-purple-600 transition-colors">
                            <Sigma size={18} />
                            Gemelo Digital
                        </button>
                    </div>
                )}

                {/* Chat FAB */}
                <button onClick={() => setChatVisible(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-30">
                    <MessageCircle size={24} className="text-white" />
                </button>
            </div>

            {/* Modal agregar evento */}
            {modalVisible && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setModalVisible(false)}>
                    <div className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-5 shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Nueva actividad</h3>
                            <button onClick={() => setModalVisible(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <span className="text-gray-400 text-xl">✕</span>
                            </button>
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Selecciona el tipo:</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {EVENT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSelectedType(opt.value)}
                                    className={`px-3 py-2 rounded-xl text-xs text-center transition-colors ${selectedType === opt.value ? 'bg-blue-400 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Nota (opcional):</p>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ej: Ordeño de la mañana, finca norte..."
                            className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-blue-300 min-h-[60px] resize-none"
                        />
                        <button
                            onClick={handleAddEvent}
                            disabled={!selectedType}
                            className={`w-full mt-3 py-3 rounded-xl font-bold text-sm text-white ${selectedType ? 'bg-blue-400 hover:bg-blue-500' : 'bg-gray-300'} transition-colors`}
                        >
                            GUARDAR ACTIVIDAD
                        </button>
                    </div>
                </div>
            )}

            <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />

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
