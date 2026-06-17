import Svg, { Circle, Text as SvgText } from "react-native-svg"
import { View, Text, StyleSheet } from "react-native"

interface Props {
    parametroNombre: string
    unidad: string | null
    valorResultado: number
    valorMinimo: number | null
    valorMaximo: number | null
    size?: number
    strokeWidth?: number
}

function porcentajeEnRango(valor: number, min: number | null, max: number | null): number {
    if (min !== null && max !== null) {
        if (max <= min) return 0
        const clamped = Math.max(min, Math.min(valor, max))
        return ((clamped - min) / (max - min)) * 100
    }
    if (min !== null) return valor >= min ? 100 : 0
    if (max !== null) return valor <= max ? 100 : 0
    return 50
}

export default function ParametroCircularChart({
    parametroNombre,
    unidad,
    valorResultado,
    valorMinimo,
    valorMaximo,
    size = 80,
    strokeWidth = 8,
}: Props) {
    const pct = porcentajeEnRango(valorResultado, valorMinimo, valorMaximo)
    const dentroDeRango =
        (valorMinimo === null && valorMaximo === null) ||
        (valorMinimo !== null && valorMaximo !== null && valorResultado >= valorMinimo && valorResultado <= valorMaximo) ||
        (valorMinimo !== null && valorMaximo === null && valorResultado >= valorMinimo) ||
        (valorMinimo === null && valorMaximo !== null && valorResultado <= valorMaximo)

    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (pct / 100) * circumference
    const color = dentroDeRango ? "#27ae60" : "#e74c3c"

    return (
        <View style={[styles.card, { width: size + 40 }]}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="#eee" strokeWidth={strokeWidth} fill="none"
                />
                <Circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90" origin={`${size / 2}, ${size / 2}`}
                />
                <SvgText
                    x={size / 2} y={size / 2}
                    textAnchor="middle" alignmentBaseline="central"
                    fontSize={size * 0.18} fontWeight="bold"
                    fill={color}
                >
                    {`${Math.round(pct)}%`}
                </SvgText>
            </Svg>
            <Text style={styles.paramName} numberOfLines={1}>{parametroNombre}</Text>
            <Text style={styles.paramValue} numberOfLines={1}>
                {valorResultado}{unidad ? ` ${unidad}` : ""}
            </Text>
            {valorMinimo !== null && valorMaximo !== null && (
                <Text style={styles.paramRange}>
                    Óptimo: {valorMinimo}–{valorMaximo}{unidad ?? ""}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
        gap: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    paramName: { fontSize: 11, fontWeight: "bold", color: "#333", textAlign: "center" },
    paramValue: { fontSize: 12, color: "#555", fontWeight: "600" },
    paramRange: { fontSize: 9, color: "#999", textAlign: "center" },
})
