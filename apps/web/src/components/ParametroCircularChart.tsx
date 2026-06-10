'use client'

interface Props {
    parametroNombre: string
    unidad: string | null
    valorResultado: number
    valorMinimo: number | null
    valorMaximo: number | null
}

export default function ParametroCircularChart({ parametroNombre, unidad, valorResultado, valorMinimo, valorMaximo }: Props) {
    const dentroDeRango = valorMinimo != null && valorMaximo != null
        ? valorResultado >= valorMinimo && valorResultado <= valorMaximo
        : true
    const porcentaje = valorMinimo != null && valorMaximo != null && valorMaximo !== valorMinimo
        ? Math.min(100, Math.max(0, ((valorResultado - valorMinimo) / (valorMaximo - valorMinimo)) * 100))
        : 50
    const color = dentroDeRango ? '#22c55e' : '#ef4444'
    const circumference = 2 * Math.PI * 36
    const offset = circumference - (porcentaje / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-1 p-3">
            <svg width="86" height="86" viewBox="0 0 86 86">
                <circle cx="43" cy="43" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="43" cy="43" r="36" fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 43 43)" />
                <text x="43" y="43" textAnchor="middle" dominantBaseline="central"
                    fontSize="14" fontWeight="bold" fill={color}>
                    {valorResultado}
                </text>
            </svg>
            <span className="text-xs text-gray-600 text-center font-medium max-w-20 truncate">
                {parametroNombre}{unidad ? ` (${unidad})` : ''}
            </span>
        </div>
    )
}
