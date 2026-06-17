'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown,
    FlaskConical, AlertCircle, CheckCircle, X,
} from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import {
    getParametrosByCentro, createParametro, updateParametro, deleteParametro,
    type ParametroCalidadDto, type CreateParametroDto, type UpdateParametroDto,
} from '../../infrastructure/parametrosApi'

export default function ParametrosPage() {
    const router = useRouter()
    const [parametros, setParametros] = useState<ParametroCalidadDto[]>([])
    const [loading, setLoading] = useState(true)
    const [centroId, setCentroId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<ParametroCalidadDto | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [nombre, setNombre] = useState('')
    const [unidad, setUnidad] = useState('')
    const [valorMinimo, setValorMinimo] = useState('')
    const [valorMaximo, setValorMaximo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [orden, setOrden] = useState('')

    useEffect(() => {
        loadUserAndParams()
    }, [])

    const loadUserAndParams = async () => {
        try {
            const userJson = localStorage.getItem('usuario')
            if (!userJson) return
            const user = JSON.parse(userJson)
            const id = user.centroAcopioId
            if (!id) {
                setError('No tienes un centro de acopio asignado.')
                return
            }
            setCentroId(id)
            await fetchParams(id)
        } catch {
            setError('No se pudo cargar la información del usuario.')
        } finally {
            setLoading(false)
        }
    }

    const fetchParams = async (id: number) => {
        try {
            const data = await getParametrosByCentro(id)
            setParametros(data)
        } catch {
            setError('No se pudieron cargar los parámetros.')
        }
    }

    const resetForm = () => {
        setNombre('')
        setUnidad('')
        setValorMinimo('')
        setValorMaximo('')
        setDescripcion('')
        setOrden(String(parametros.length + 1))
        setEditing(null)
    }

    const openEdit = (p: ParametroCalidadDto) => {
        setNombre(p.nombre)
        setUnidad(p.unidad ?? '')
        setValorMinimo(p.valorMinimo != null ? String(p.valorMinimo) : '')
        setValorMaximo(p.valorMaximo != null ? String(p.valorMaximo) : '')
        setDescripcion(p.descripcion ?? '')
        setOrden(String(p.orden))
        setEditing(p)
        setShowForm(true)
    }

    const openNew = () => {
        resetForm()
        setOrden(String(parametros.length + 1))
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!nombre.trim()) {
            setError('El nombre del parámetro es obligatorio.')
            return
        }
        if (!centroId) return

        setSaving(true)
        setError('')
        try {
            const base = {
                nombre: nombre.trim(),
                unidad: unidad.trim() || null,
                valorMinimo: valorMinimo ? Number(valorMinimo) : null,
                valorMaximo: valorMaximo ? Number(valorMaximo) : null,
                descripcion: descripcion.trim() || null,
                orden: Number(orden) || parametros.length + 1,
            }

            if (editing) {
                await updateParametro(editing.parametroId, base as UpdateParametroDto)
            } else {
                await createParametro({ ...base, centroAcopioId: centroId } as CreateParametroDto)
            }

            setShowForm(false)
            resetForm()
            await fetchParams(centroId)
            setSuccess(editing ? 'Parámetro actualizado.' : 'Parámetro creado.')
        } catch (error: any) {
            setError(error.message ?? 'No se pudo guardar el parámetro.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (p: ParametroCalidadDto) => {
        if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return
        try {
            await deleteParametro(p.parametroId)
            if (centroId) await fetchParams(centroId)
            setSuccess('Parámetro eliminado.')
        } catch (error: any) {
            setError(error.message ?? 'No se pudo eliminar.')
        }
    }

    const moveUp = async (index: number) => {
        if (index === 0) return
        const list = [...parametros]
        const temp = list[index]
        list[index] = list[index - 1]
        list[index - 1] = temp

        const updated = list.map((p, i) => ({ ...p, orden: i + 1 }))
        setParametros(updated)

        try {
            for (const p of updated) {
                await updateParametro(p.parametroId, {
                    nombre: p.nombre,
                    unidad: p.unidad,
                    valorMinimo: p.valorMinimo,
                    valorMaximo: p.valorMaximo,
                    descripcion: p.descripcion,
                    orden: p.orden,
                })
            }
        } catch {
            if (centroId) await fetchParams(centroId)
        }
    }

    const moveDown = async (index: number) => {
        if (index === parametros.length - 1) return
        const list = [...parametros]
        const temp = list[index]
        list[index] = list[index + 1]
        list[index + 1] = temp

        const updated = list.map((p, i) => ({ ...p, orden: i + 1 }))
        setParametros(updated)

        try {
            for (const p of updated) {
                await updateParametro(p.parametroId, {
                    nombre: p.nombre,
                    unidad: p.unidad,
                    valorMinimo: p.valorMinimo,
                    valorMaximo: p.valorMaximo,
                    descripcion: p.descripcion,
                    orden: p.orden,
                })
            }
        } catch {
            if (centroId) await fetchParams(centroId)
        }
    }

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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard-centro')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Parámetros de calidad</h1>
                </div>
                {!showForm && (
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="ml-auto">&times;</button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
                    <CheckCircle size={16} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="ml-auto">&times;</button>
                </div>
            )}

            {showForm ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl">
                    <h2 className="text-lg font-bold text-gray-800 mb-5">
                        {editing ? 'Editar parámetro' : 'Nuevo parámetro'}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                value={nombre} onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Acidez"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                            <input
                                value={unidad} onChange={(e) => setUnidad(e.target.value)}
                                placeholder="Ej: g/L, pH, °C"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo óptimo</label>
                                <input
                                    type="number" step="any"
                                    value={valorMinimo} onChange={(e) => setValorMinimo(e.target.value)}
                                    placeholder="Ej: 0.5"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor máximo óptimo</label>
                                <input
                                    type="number" step="any"
                                    value={valorMaximo} onChange={(e) => setValorMaximo(e.target.value)}
                                    placeholder="Ej: 1.5"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                            <input
                                type="number"
                                value={orden} onChange={(e) => setOrden(e.target.value)}
                                placeholder="Posición en el formulario"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Instrucción</label>
                            <textarea
                                value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Describe qué debe medir el trabajador..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setShowForm(false); resetForm() }}
                                className="flex-1 bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {parametros.length === 0 ? (
                        <div className="text-center py-16">
                            <FlaskConical size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-400">No hay parámetros definidos. Agrega el primero.</p>
                        </div>
                    ) : (
                        parametros.map((p, index) => (
                            <div key={p.parametroId} className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">#{p.orden}</span>
                                            <h3 className="font-semibold text-gray-800">{p.nombre}</h3>
                                        </div>
                                        {p.unidad && <p className="text-sm text-gray-500 mt-0.5">Unidad: {p.unidad}</p>}
                                        {(p.valorMinimo != null || p.valorMaximo != null) && (
                                            <p className="text-sm text-gray-500">
                                                Rango óptimo: {p.valorMinimo ?? '—'} - {p.valorMaximo ?? '—'}
                                            </p>
                                        )}
                                        {p.descripcion && (
                                            <p className="text-xs text-gray-400 italic mt-1">{p.descripcion}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                        <button onClick={() => moveUp(index)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Subir">
                                            <ChevronUp size={16} className="text-gray-500" />
                                        </button>
                                        <button onClick={() => moveDown(index)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Bajar">
                                            <ChevronDown size={16} className="text-gray-500" />
                                        </button>
                                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Editar">
                                            <Pencil size={16} className="text-blue-600" />
                                        </button>
                                        <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar">
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </AppLayout>
    )
}
