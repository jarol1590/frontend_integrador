'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    Home, Droplets, Package, Truck, FlaskConical, Settings,
    Sigma, LogOut, Menu, X, User, Bell, QrCode, MessageCircle,
    ChevronLeft, Flame,
} from 'lucide-react'

interface NavItem {
    label: string
    icon: ReactNode
    href: string
    roles?: string[]
}

const topNav: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/dashboard', roles: ['productor'] },
    { label: 'Dashboard', icon: <Home size={20} />, href: '/dashboard-centro', roles: ['centro_acopio', 'trabajador_centro_acopio'] },
    { label: 'Ordeños', icon: <Droplets size={20} />, href: '/ordenos', roles: ['productor'] },
    { label: 'Lotes', icon: <Package size={20} />, href: '/lotes', roles: ['productor'] },
    { label: 'Transportes', icon: <Truck size={20} />, href: '/transportes', roles: ['trabajador_centro_acopio'] },
    { label: 'Análisis', icon: <FlaskConical size={20} />, href: '/analisis', roles: ['trabajador_centro_acopio'] },
    { label: 'Parámetros', icon: <Settings size={20} />, href: '/parametros', roles: ['centro_acopio'] },
    { label: 'Riesgo Regional', icon: <Flame size={20} />, href: '/riesgo-regional', roles: ['centro_acopio', 'trabajador_centro_acopio'] },
    { label: 'Gemelo Digital', icon: <Sigma size={20} />, href: '/gemelo', roles: ['productor'] },
    { label: 'Admin', icon: <User size={20} />, href: '/admin', roles: ['administrador'] },
]

export default function AppLayout({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userName, setUserName] = useState('')
    const [userRole, setUserRole] = useState('productor')

    useEffect(() => {
        const usuario = localStorage.getItem('usuario')
        const token = localStorage.getItem('token')
        if (usuario) {
            try {
                const u = JSON.parse(usuario)
                setUserName(u.email ?? '')
                const roleMap: Record<string, string> = {
                    'Administrador': 'administrador',
                    'Centro de Acopio': 'centro_acopio',
                    'Productor': 'productor',
                    'Trabajador Centro de acopio': 'trabajador_centro_acopio',
                }
                setUserRole(roleMap[u.rolNombre] ?? 'productor')

                if (u.usuarioId && token) {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/public/${u.usuarioId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then(r => r.json())
                        .then(json => {
                            const data = json.response ?? json
                            const name = data?.trabajador?.nombre ?? data?.centroAcopio?.nombre ?? data?.productor?.nombre
                            if (name) setUserName(name)
                        })
                        .catch(() => {})
                }
            } catch { }
        }
    }, [pathname])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        router.push('/login')
    }

    const visibleNav = topNav.filter(item => !item.roles || item.roles.includes(userRole))

    return (
        <div className="min-h-screen flex">
            {/* Sidebar overlay on mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Droplets size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-800">Integrador</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {visibleNav.map((item) => {
                        const active = pathname === item.href
                        return (
                            <button
                                key={item.href}
                                onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                {/* User */}
                <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
                            <p className="text-xs text-gray-400">
                                {userRole === 'trabajador_centro_acopio' ? 'Trabajador' :
                                 userRole === 'centro_acopio' ? 'Centro de Acopio' :
                                 userRole === 'administrador' ? 'Administrador' : 'Productor'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={16} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar (mobile) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Menu size={22} />
                    </button>
                    <span className="font-bold text-gray-800">Proyecto Integrador</span>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-red-500">
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
