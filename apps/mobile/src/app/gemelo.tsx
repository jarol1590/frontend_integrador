import { useState, useEffect, useCallback } from "react"
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ImageBackground, ActivityIndicator, RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import Svg, { Circle, Text as SvgText } from "react-native-svg"
import { LineChart } from "react-native-gifted-charts"
import ResponseModal from "../components/ResponseModal"
import { getMiPerfil } from "../infrastructure/dashboardApi"
import {
    getGemeloEstado, getClima, getPredicciones, getAlertas,
    sincronizarGemelo, marcarAlertaLeida,
    type FincaGemeloEstadoDto, type LecturaClimaticaDto,
    type PrediccionGemeloDto, type AlertaGemeloDto,
} from "../infrastructure/gemeloApi"

function formatFecha(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })
}

function severityColor(s: string): string {
    switch (s) {
        case "critica": return "#e74c3c"
        case "alta": return "#e67e22"
        case "media": return "#f1c40f"
        default: return "#95a5a6"
    }
}

function riskColor(score: number): string {
    if (score >= 60) return "#e74c3c"
    if (score >= 30) return "#e67e22"
    return "#27ae60"
}

function RiskGauge({ score, size = 100 }: { score: number; size?: number }) {
    const radius = (size - 16) / 2
    const circumference = 2 * Math.PI * radius
    const pct = Math.min(score, 100)
    const strokeDashoffset = circumference - (pct / 100) * circumference
    const color = riskColor(score)
    return (
        <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#eee" strokeWidth={12} fill="none" />
            <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={color} strokeWidth={12} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90" origin={`${size / 2}, ${size / 2}`}
            />
            <SvgText
                x={size / 2} y={size / 2 - 6}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={size * 0.22} fontWeight="bold" fill={color}
            >
                {score}
            </SvgText>
            <SvgText
                x={size / 2} y={size / 2 + 16}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={size * 0.1} fill="#888"
            >
                riesgo
            </SvgText>
        </Svg>
    )
}

export default function GemeloScreen() {
    const params = useLocalSearchParams<{ fincaId?: string; fincaNombre?: string }>()
    const [fincaId, setFincaId] = useState<number | null>(params.fincaId ? Number(params.fincaId) : null)
    const [fincaNombre, setFincaNombre] = useState(params.fincaNombre ?? "")
    const [estado, setEstado] = useState<FincaGemeloEstadoDto | null>(null)
    const [lecturas, setLecturas] = useState<LecturaClimaticaDto[]>([])
    const [predicciones, setPredicciones] = useState<PrediccionGemeloDto[]>([])
    const [alertas, setAlertas] = useState<AlertaGemeloDto[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [modal, setModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })

    const showModal = (type: "success" | "error", title: string, message: string) =>
        setModal({ visible: true, type, title, message })

    const hasta = new Date()
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const desdeStr = desde.toISOString().split("T")[0]
    const hastaStr = hasta.toISOString().split("T")[0]

    const loadData = useCallback(async () => {
        try {
            let fid = fincaId
            let fnombre = fincaNombre

            if (!fid) {
                const perfil = await getMiPerfil()
                const finca = perfil.fincas?.[0]
                if (!finca) { showModal("error", "Error", "No tienes fincas asignadas."); return }
                fid = finca.fincaId
                fnombre = finca.nombre
            }

            if (!fid) { showModal("error", "Error", "No se pudo determinar la finca."); return }
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
            showModal("error", "Error", e?.message ?? "No se pudo cargar el gemelo digital.")
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
            showModal("success", "Sincronizado", "Gemelo digital actualizado correctamente.")
            await loadData()
        } catch (e: any) {
            showModal("error", "Error de sincronización", e?.message ?? "Verifica que la finca tenga coordenadas GPS.")
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
            showModal("error", "Error", e?.message ?? "No se pudo marcar la alerta.")
        }
    }

    const predVolumen = predicciones.find(p => p.tipoPrediccion === "volumen_produccion")
    const predAcidificacion = predicciones.find(p => p.tipoPrediccion === "riesgo_acidificacion")
    const climaActual = estado?.climaActual

    const chartData = lecturas.slice(-21).map(l => ({
        value: Number(l.tempMedia.toFixed(1)),
        label: formatFecha(l.fecha),
    }))
    const chartDataThi = lecturas.slice(-21).map(l => ({
        value: l.thiMax != null ? Number(l.thiMax.toFixed(0)) : 0,
    }))

    const thiThreshold = 72
    const chartYMax = Math.max(
        ...chartData.map(d => d.value),
        ...chartDataThi.map(d => d.value),
        thiThreshold + 10,
        40
    )

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{ transform: [{ scale: 1.2 }, { translateY: 285 }], opacity: 0.2 }}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gemelo Digital</Text>
                <TouchableOpacity onPress={handleSync} disabled={syncing}>
                    {syncing ? (
                        <ActivityIndicator size="small" color="#6eaaff" />
                    ) : (
                        <Ionicons name="sync-outline" size={24} color="#6eaaff" />
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={loadData} colors={["#6eaaff"]} />
                    }
                >
                    <Text style={styles.fincaName}>{fincaNombre}</Text>

                    {/* Estado general */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusLabel}>Riesgo global</Text>
                            <RiskGauge score={estado?.scoreRiesgoGlobal ?? 0} />
                            {estado && (
                                <Text style={[styles.syncBadge, {
                                    color: estado.estadoSync === "ok" ? "#27ae60" :
                                           estado.estadoSync === "degradado" ? "#e67e22" : "#e74c3c"
                                }]}>
                                    {estado.estadoSync === "ok" ? "Sincronizado" :
                                     estado.estadoSync === "degradado" ? "Degradado" :
                                     estado.estadoSync === "error" ? "Error" : "Pendiente"}
                                </Text>
                            )}
                        </View>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusLabel}>Clima actual</Text>
                            {climaActual ? (
                                <>
                                    <Text style={styles.climaTemp}>{climaActual.tempMedia}°C</Text>
                                    <Text style={styles.climaDetail}>
                                        {climaActual.humedadMedia != null ? `${climaActual.humedadMedia}% HR` : "—"}
                                    </Text>
                                    {climaActual.thiMax != null && (
                                        <Text style={[styles.climaDetail, {
                                            color: climaActual.thiMax >= thiThreshold ? "#e67e22" : "#27ae60"
                                        }]}>
                                            THI {climaActual.thiMax}
                                        </Text>
                                    )}
                                    {climaActual.diasConsecutivosCalor > 0 && (
                                        <View style={styles.heatBadge}>
                                            <Ionicons name="flame" size={12} color="#e74c3c" />
                                            <Text style={styles.heatText}>{climaActual.diasConsecutivosCalor} días</Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={styles.noData}>Sincroniza para ver clima</Text>
                            )}
                        </View>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusLabel}>Alertas</Text>
                            <Text style={styles.alertaCount}>{alertas.length}</Text>
                            <Text style={styles.climaDetail}>activas</Text>
                        </View>
                    </View>

                    {/* Predicciones */}
                    <View style={styles.sectionTitle}>
                        <Ionicons name="trending-up-outline" size={18} color="#555" />
                        <Text style={styles.sectionTitleText}>Pronóstico 7 días</Text>
                    </View>
                    <View style={styles.predRow}>
                        <View style={styles.predCard}>
                            <Ionicons name="water-outline" size={22} color="#3498db" />
                            <Text style={styles.predLabel}>Producción</Text>
                            {predVolumen ? (
                                <>
                                    <Text style={styles.predValor}>{predVolumen.valor.toFixed(0)}</Text>
                                    <Text style={styles.predUnidad}>{predVolumen.unidad ?? "L/día"}</Text>
                                    <Text style={styles.predConfianza}>
                                        {`${(predVolumen.confianza * 100).toFixed(0)}% confianza`}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.noData}>—</Text>
                            )}
                        </View>
                        <View style={styles.predCard}>
                            <Ionicons name="flask-outline" size={22} color={predAcidificacion?.valor ?? 0 > 50 ? "#e74c3c" : "#27ae60"} />
                            <Text style={styles.predLabel}>Riesgo acidif.</Text>
                            {predAcidificacion ? (
                                <>
                                    <Text style={[styles.predValor, { color: riskColor(predAcidificacion.valor) }]}>
                                        {predAcidificacion.valor.toFixed(0)}
                                    </Text>
                                    <Text style={styles.predUnidad}>{predAcidificacion.unidad ?? "/100"}</Text>
                                    <Text style={styles.predConfianza}>
                                        {`${(predAcidificacion.confianza * 100).toFixed(0)}% confianza`}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.noData}>—</Text>
                            )}
                        </View>
                    </View>

                    {/* Gráfico climático */}
                    <View style={styles.sectionTitle}>
                        <Ionicons name="thermometer-outline" size={18} color="#555" />
                        <Text style={styles.sectionTitleText}>Temperatura y THI (últimos 21 días)</Text>
                    </View>
                    <View style={styles.chartCard}>
                        {chartData.length > 0 ? (
                            <LineChart
                                data={chartData}
                                data2={chartDataThi}
                                height={200}
                                width={280}
                                color1="#e74c3c"
                                color2="#3498db"
                                dataPointsColor1="#e74c3c"
                                dataPointsColor2="#3498db"
                                textColor="#888"
                                yAxisTextStyle={{ fontSize: 10, color: "#888" }}
                                xAxisLabelTextStyle={{ fontSize: 8, color: "#888", rotation: 45 }}
                                yAxisOffset={0}
                                maxValue={chartYMax}
                                noOfSections={4}
                                startFillColor1="rgba(231,76,60,0.1)"
                                endFillColor1="rgba(231,76,60,0)"
                                startFillColor2="rgba(52,152,219,0.1)"
                                endFillColor2="rgba(52,152,219,0)"
                                isAnimated
                                showVerticalLines
                                thickness={2}
                            />
                        ) : (
                            <Text style={styles.noData}>Sincroniza para ver datos climáticos</Text>
                        )}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#e74c3c" }]} />
                                <Text style={styles.legendText}>Temp. °C</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#3498db" }]} />
                                <Text style={styles.legendText}>THI</Text>
                            </View>
                            <Text style={styles.umbralText}>Umbral calor {thiThreshold}</Text>
                        </View>
                    </View>

                    {/* Alertas */}
                    <View style={styles.sectionTitle}>
                        <Ionicons name="notifications-outline" size={18} color="#555" />
                        <Text style={styles.sectionTitleText}>Alertas activas</Text>
                    </View>
                    {alertas.length === 0 ? (
                        <View style={styles.card}>
                            <Ionicons name="checkmark-circle-outline" size={32} color="#27ae60" />
                            <Text style={styles.noAlerts}>No hay alertas activas</Text>
                        </View>
                    ) : (
                        alertas.map(a => (
                            <View key={a.alertaId} style={styles.alertaCard}>
                                <View style={styles.alertaHeader}>
                                    <View style={[styles.severityBadge, { backgroundColor: severityColor(a.severidad) }]}>
                                        <Text style={styles.severityText}>{a.severidad.toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.alertaTipo}>{a.tipoAlerta.replace(/_/g, " ")}</Text>
                                    <TouchableOpacity onPress={() => handleMarcarLeida(a)}>
                                        <Ionicons name="checkmark-circle-outline" size={22} color="#27ae60" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.alertaTitulo}>{a.titulo}</Text>
                                <Text style={styles.alertaMensaje}>{a.mensaje}</Text>
                                {a.recomendacion && (
                                    <View style={styles.recomBox}>
                                        <Ionicons name="bulb-outline" size={14} color="#e67e22" />
                                        <Text style={styles.recomText}>{a.recomendacion}</Text>
                                    </View>
                                )}
                                <Text style={styles.alertaFecha}>{formatFecha(a.creadaUtc)}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            <ResponseModal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 15,
        backgroundColor: "rgba(255,255,255,0.97)",
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
    fincaName: { fontSize: 20, fontWeight: "bold", color: "#222", textAlign: "center" },
    statusRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
    statusCard: {
        flex: 1, backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16,
        padding: 14, alignItems: "center", gap: 4, elevation: 2,
    },
    statusLabel: { fontSize: 11, fontWeight: "bold", color: "#888", textTransform: "uppercase" },
    syncBadge: { fontSize: 10, fontWeight: "bold", marginTop: 2 },
    climaTemp: { fontSize: 22, fontWeight: "bold", color: "#222" },
    climaDetail: { fontSize: 12, color: "#666" },
    heatBadge: {
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#fde8e8", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    },
    heatText: { fontSize: 11, color: "#e74c3c", fontWeight: "bold" },
    noData: { fontSize: 12, color: "#aaa", fontStyle: "italic", textAlign: "center" },
    noAlerts: { fontSize: 14, color: "#aaa", textAlign: "center" },
    alertaCount: { fontSize: 28, fontWeight: "bold", color: "#e74c3c" },
    sectionTitle: {
        flexDirection: "row", alignItems: "center", gap: 6,
        marginTop: 8, marginBottom: 4,
    },
    sectionTitleText: { fontSize: 15, fontWeight: "bold", color: "#555" },
    predRow: { flexDirection: "row", gap: 12 },
    predCard: {
        flex: 1, backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16,
        padding: 16, alignItems: "center", gap: 4, elevation: 2,
    },
    predLabel: { fontSize: 11, fontWeight: "bold", color: "#888", textTransform: "uppercase" },
    predValor: { fontSize: 28, fontWeight: "bold", color: "#222" },
    predUnidad: { fontSize: 12, color: "#888" },
    predConfianza: { fontSize: 10, color: "#aaa" },
    chartCard: {
        backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16,
        padding: 14, alignItems: "center", elevation: 2,
    },
    legend: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: "#888" },
    umbralText: { fontSize: 11, color: "#e67e22", marginLeft: "auto" },
    card: {
        backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16,
        padding: 24, alignItems: "center", gap: 8, elevation: 2,
    },
    alertaCard: {
        backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16,
        padding: 16, gap: 8, elevation: 2,
    },
    alertaHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    severityText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
    alertaTipo: { flex: 1, fontSize: 11, color: "#888", textTransform: "capitalize" },
    alertaTitulo: { fontSize: 14, fontWeight: "bold", color: "#222" },
    alertaMensaje: { fontSize: 13, color: "#555", lineHeight: 18 },
    recomBox: {
        flexDirection: "row", alignItems: "flex-start", gap: 6,
        backgroundColor: "#fef9e7", padding: 10, borderRadius: 12,
    },
    recomText: { flex: 1, fontSize: 12, color: "#7d6608", lineHeight: 16 },
    alertaFecha: { fontSize: 11, color: "#aaa", textAlign: "right" },
})
