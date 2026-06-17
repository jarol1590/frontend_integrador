import React, { useState, useEffect, useCallback } from "react"
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ImageBackground, ActivityIndicator,
    Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import MapView, { Marker, Callout, Circle } from "react-native-maps"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ResponseModal from "../components/ResponseModal"
import { getRiesgoRegional, type CentroAcopioRiesgoRegionalDto, type RiesgoRegionalFincaDto } from "../infrastructure/gemeloApi"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

function riskColor(score: number): string {
    if (score >= 60) return "#e74c3c"
    if (score >= 30) return "#e67e22"
    return "#27ae60"
}

const COLOMBIA_CENTER = {
    latitude: 4.5709,
    longitude: -74.2973,
}

export default function RiesgoRegionalScreen() {
    const [data, setData] = useState<CentroAcopioRiesgoRegionalDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [centroAcopioId, setCentroAcopioId] = useState<number | null>(null)
    const [error, setError] = useState("")
    const [selectedFinca, setSelectedFinca] = useState<RiesgoRegionalFincaDto | null>(null)
    const [modal, setModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })

    const showModal = (type: "success" | "error", title: string, message: string) =>
        setModal({ visible: true, type, title, message })

    useEffect(() => {
        AsyncStorage.getItem("usuario").then(userJson => {
            if (userJson) {
                const user = JSON.parse(userJson)
                if (user.centroAcopioId) {
                    setCentroAcopioId(user.centroAcopioId)
                }
            }
        })
    }, [])

    const loadData = useCallback(async () => {
        if (!centroAcopioId) return
        try {
            setLoading(true)
            setError("")
            const res = await getRiesgoRegional(centroAcopioId)
            setData(res)
        } catch (e: any) {
            const msg = e?.message ?? "Error al cargar riesgo regional"
            setError(msg)
            showModal("error", "Error", msg)
        } finally {
            setLoading(false)
        }
    }, [centroAcopioId])

    useEffect(() => { if (centroAcopioId) loadData() }, [centroAcopioId, loadData])

    const fincasConCoords = data?.fincas.filter(f => f.latitud != null && f.longitud != null) ?? []

    const region = (() => {
        if (fincasConCoords.length > 0) {
            const avgLat = fincasConCoords.reduce((s, f) => s + f.latitud!, 0) / fincasConCoords.length
            const avgLng = fincasConCoords.reduce((s, f) => s + f.longitud!, 0) / fincasConCoords.length
            return {
                latitude: avgLat,
                longitude: avgLng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }
        }
        return { ...COLOMBIA_CENTER, latitudeDelta: 8, longitudeDelta: 8 }
    })()

    const totalAlertas = data?.fincas.reduce((s, f) => s + f.alertasActivas, 0) ?? 0
    const sinCoords = data ? data.fincas.length - fincasConCoords.length : 0

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Riesgo Regional</Text>
                <TouchableOpacity onPress={loadData} disabled={loading}>
                    <Ionicons name="refresh-outline" size={24} color="#6eaaff" />
                </TouchableOpacity>
            </View>

            {/* Stats bar */}
            {data && (
                <View style={styles.statsBar}>
                    <View style={styles.stat}>
                        <Ionicons name="flame-outline" size={14} color={riskColor(data.scoreRiesgoPromedio)} />
                        <Text style={[styles.statText, { color: riskColor(data.scoreRiesgoPromedio) }]}>
                            {data.scoreRiesgoPromedio}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="location-outline" size={14} color="#3498db" />
                        <Text style={styles.statText}>{data.fincas.length}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="alert-circle-outline" size={14} color="#e74c3c" />
                        <Text style={[styles.statText, { color: "#e74c3c" }]}>{totalAlertas}</Text>
                    </View>
                    {sinCoords > 0 && (
                        <View style={styles.stat}>
                            <Ionicons name="warning-outline" size={14} color="#e67e22" />
                            <Text style={[styles.statText, { color: "#e67e22" }]}>{sinCoords} sin coord</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Map */}
            <View style={styles.mapContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 40 }} />
                ) : error ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
                        <Text style={styles.emptyText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <MapView style={styles.map} initialRegion={region}>
                        {fincasConCoords.map(f => (
                            <React.Fragment key={f.fincaId}>
                                <Circle
                                    center={{ latitude: f.latitud!, longitude: f.longitud! }}
                                    radius={f.scoreRiesgoGlobal >= 60 ? 500 : f.scoreRiesgoGlobal >= 30 ? 400 : 300}
                                    fillColor={riskColor(f.scoreRiesgoGlobal) + "66"}
                                    strokeColor={riskColor(f.scoreRiesgoGlobal)}
                                    strokeWidth={2}
                                />
                                <Marker
                                    coordinate={{ latitude: f.latitud!, longitude: f.longitud! }}
                                    onPress={() => {
                                        router.push({ pathname: "/gemelo" as any, params: { fincaId: String(f.fincaId), fincaNombre: f.fincaNombre } })
                                    }}
                                >
                                    <View style={[styles.markerCircle, {
                                        backgroundColor: riskColor(f.scoreRiesgoGlobal),
                                        width: f.scoreRiesgoGlobal >= 60 ? 32 : f.scoreRiesgoGlobal >= 30 ? 26 : 20,
                                        height: f.scoreRiesgoGlobal >= 60 ? 32 : f.scoreRiesgoGlobal >= 30 ? 26 : 20,
                                        borderRadius: f.scoreRiesgoGlobal >= 60 ? 16 : f.scoreRiesgoGlobal >= 30 ? 13 : 10,
                                    }]}>
                                        <Text style={styles.markerText}>{f.scoreRiesgoGlobal}</Text>
                                    </View>
                                    <Callout tooltip>
                                        <View style={styles.callout}>
                                            <Text style={styles.calloutTitle}>{f.fincaNombre}</Text>
                                            <Text style={styles.calloutText}>{f.municipioNombre}</Text>
                                            <View style={styles.calloutRow}>
                                                <Ionicons name="flame" size={12} color={riskColor(f.scoreRiesgoGlobal)} />
                                                <Text style={[styles.calloutText, { color: riskColor(f.scoreRiesgoGlobal), fontWeight: "bold" }]}>
                                                    Riesgo: {f.scoreRiesgoGlobal}
                                                </Text>
                                            </View>
                                            {f.tempMediaReciente != null && (
                                                <View style={styles.calloutRow}>
                                                    <Ionicons name="thermometer-outline" size={12} color="#555" />
                                                    <Text style={styles.calloutText}>{f.tempMediaReciente}°C</Text>
                                                </View>
                                            )}
                                            {f.alertasActivas > 0 && (
                                                <View style={styles.calloutRow}>
                                                    <Ionicons name="alert-circle" size={12} color="#e74c3c" />
                                                    <Text style={[styles.calloutText, { color: "#e74c3c" }]}>
                                                        {f.alertasActivas} alerta{f.alertasActivas !== 1 ? "s" : ""}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text style={styles.calloutAction}>Ver gemelo →</Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            </React.Fragment>
                        ))}
                    </MapView>
                )}
            </View>

            {/* Bottom sheet: fincas list */}
            {data && (
                <View style={styles.bottomSheet}>
                    <View style={styles.bottomSheetHandle} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.fincasScroll}
                    >
                        {data.fincas.map(f => (
                            <TouchableOpacity
                                key={f.fincaId}
                                style={[styles.fincaChip, { borderLeftColor: riskColor(f.scoreRiesgoGlobal), borderLeftWidth: 3 }]}
                                onPress={() => router.push({ pathname: "/gemelo" as any, params: { fincaId: String(f.fincaId), fincaNombre: f.fincaNombre } })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.fincaChipName}>{f.fincaNombre}</Text>
                                <Text style={styles.fincaChipMeta}>{f.municipioNombre}</Text>
                                <View style={styles.fincaChipScore}>
                                    <View style={[styles.scoreDot, { backgroundColor: riskColor(f.scoreRiesgoGlobal) }]} />
                                    <Text style={[styles.fincaChipScoreText, { color: riskColor(f.scoreRiesgoGlobal) }]}>
                                        {f.scoreRiesgoGlobal}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
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
    safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 12,
        backgroundColor: "rgba(255,255,255,0.97)",
    },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    statsBar: {
        flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.95)",
    },
    stat: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#f8f9fa", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    },
    statText: { fontSize: 12, fontWeight: "bold", color: "#555" },
    mapContainer: { flex: 1, margin: 0 },
    map: { width: "100%", height: "100%" },
    callout: { minWidth: 160, gap: 3, padding: 2 },
    calloutTitle: { fontSize: 14, fontWeight: "bold", color: "#222", marginBottom: 2 },
    calloutText: { fontSize: 12, color: "#666" },
    calloutRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    calloutAction: { fontSize: 11, color: "#6eaaff", fontWeight: "bold", marginTop: 4, textAlign: "right" },
    bottomSheet: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 8,
        paddingBottom: 20,
        maxHeight: 130,
    },
    bottomSheetHandle: {
        width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2,
        alignSelf: "center", marginBottom: 8,
    },
    fincasScroll: { paddingHorizontal: 16, gap: 10, alignItems: "flex-start" },
    fincaChip: {
        backgroundColor: "#f8f9fa", borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        minWidth: 130, gap: 2,
    },
    fincaChipName: { fontSize: 12, fontWeight: "bold", color: "#222" },
    fincaChipMeta: { fontSize: 10, color: "#888" },
    fincaChipScore: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    scoreDot: { width: 8, height: 8, borderRadius: 4 },
    fincaChipScoreText: { fontSize: 14, fontWeight: "bold" },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
    emptyText: { fontSize: 14, color: "#888", textAlign: "center" },
    retryButton: {
        backgroundColor: "#6eaaff", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
    },
    retryText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    markerCircle: {
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "#fff",
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    },
    markerText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
})
