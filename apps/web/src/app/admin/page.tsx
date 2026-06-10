'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, RefreshCw, Loader2, ChevronLeft } from 'lucide-react'
import AppLayout from '../../components/AppLayout'

interface AdminUser {
    usuarioId: number
    email: string
    estado: string
    tipoUsuario: string
    fechaCreacion: string
}

const LABELS: Record<string, string> = {
    administrador: 'Administrador',
    centro_acopio: 'Centro de Acopio',
    productor: 'Productor',
    trabajador_centro_acopio: 'Trabajador',
}

const ROLE_COLORS: Record<string, string> = {
    administrador: '#8e44ad',
    centro_acopio: '#2980b9',
    productor: '#27ae60',
    trabajador_centro_acopio: '#d35400',
}

const SECTION_ORDER = ['administrador', 'centro_acopio', 'productor', 'trabajador_centro_acopio']

function groupByRole(users: AdminUser[]): { tipo: string; data: AdminUser[] }[] {
    const map = new Map<string, AdminUser[]>()
    for (const u of users) {
        const key = u.tipoUsuario
        const list = map.get(key) ?? []
        list.push(u)
        map.set(key, list)
    }
    return SECTION_ORDER.filter(t => map.has(t)).map(tipo => ({ tipo, data: map.get(tipo)! }))
}

export default function Admin() {
    const router = useRouter()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const json = await res.json()
            const list = json.response ?? json
            setUsers(Array.isArray(list) ? list : [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    const sections = groupByRole(users)

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-white/70 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <ShieldCheck size={28} className="text-gray-800" />
                    <h1 className="text-xl font-bold text-gray-800">Panel de Administración</h1>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando usuarios...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sections.map(({ tipo, data }) => {
                            const roleColor = ROLE_COLORS[tipo] ?? '#555'
                            return (
                                <div key={tipo}>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roleColor }} />
                                        <span className="text-sm font-bold text-gray-800 flex-1">{LABELS[tipo] ?? tipo}</span>
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: roleColor + '22', color: roleColor }}>
                                            {data.length}
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-400 text-xs">
                                                    <th className="pb-2 pr-3">Email</th>
                                                    <th className="pb-2 pr-3">Estado</th>
                                                    <th className="pb-2 pr-3">Rol</th>
                                                    <th className="pb-2">Creado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.map(user => {
                                                    const isActive = user.estado?.toLowerCase() === 'activo'
                                                    return (
                                                        <tr key={user.usuarioId} className="hover:bg-gray-50 transition-colors">
                                                            <td className="py-2.5 pr-3 font-medium text-gray-800">{user.email}</td>
                                                            <td className="py-2.5 pr-3">
                                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                    {user.estado}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 pr-3">
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: roleColor + '22', color: roleColor }}>
                                                                    {LABELS[user.tipoUsuario] ?? '--'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 text-gray-400 text-xs">
                                                                {new Date(user.fechaCreacion).toLocaleDateString('es-CO')}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}

                        <button onClick={fetchUsers} className="w-full flex items-center justify-center gap-2 py-3 bg-white/70 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-500 font-semibold">
                            <RefreshCw size={16} />
                            Actualizar
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
