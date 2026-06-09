import { useState, useEffect, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    ImageBackground,
    ActivityIndicator,
    Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ResponseModal from "../components/ResponseModal"
import { getTransportesByCentro, completarTransporte, TransporteDto } from "../infrastructure/ordenosApi"

const TIMEZONE = "America/Bogota"

function formatFecha(iso: string | null): string {
    if (!iso) return ""
    return new Date(iso).toLocaleString("es-CO", { timeZone: TIMEZONE })
}

function formatFechaShort(iso: string | null): string {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("es-CO", { timeZone: TIMEZONE })
}

export default function Transportes() {
    const [transportes, setTransportes] = useState<TransporteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [selectedTransporte, setSelectedTransporte] = useState<TransporteDto | null>(null)
    const [responseModal, setResponseModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })

    const loadTransportes = useCallback(async () => {
        setLoading(true)
        try {
            const userJson = await AsyncStorage.getItem("usuario")
            const user = userJson ? JSON.parse(userJson) : null
            const centroAcopioId = user?.centroAcopioId
            if (!centroAcopioId) {
                setResponseModal({ visible: true, type: "error", title: "Error", message: "No tienes un centro de acopio asignado" })
                setTransportes([])
                return
            }
            const data = await getTransportesByCentro(centroAcopioId)
            setTransportes(data)
        } catch {
            setResponseModal({ visible: true, type: "error", title: "Error", message: "No se pudieron cargar los transportes" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadTransportes() }, [loadTransportes])

    const abiertos = transportes.filter(t => !t.fechaHoraEntrada)
    const completados = transportes.filter(t => t.fechaHoraEntrada)

    const handleCompletar = async () => {
        if (!selectedTransporte) return
        setEditing(true)
        try {
            await completarTransporte(selectedTransporte.transporteId)
            setSelectedTransporte(null)
            setResponseModal({ visible: true, type: "success", title: "Éxito", message: "Llegada registrada correctamente" })
            await loadTransportes()
        } catch (e: any) {
            const msg = e?.message ?? "Error al registrar la llegada"
            setResponseModal({ visible: true, type: "error", title: "Error", message: msg })
        } finally {
            setEditing(false)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
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
                <Text style={styles.headerTitle}>Transportes</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={abiertos}
                    keyExtractor={i => i.transporteId.toString()}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={() => (
                        <>
                            <Text style={styles.sectionTitle}>Abiertos</Text>
                            {abiertos.length === 0 && <Text style={styles.emptyText}>Sin transportes abiertos</Text>}
                        </>
                    )}
                    ListFooterComponent={() => (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Completados</Text>
                            {completados.length === 0 ? (
                                <Text style={styles.emptyText}>Sin transportes completados</Text>
                            ) : (
                                completados.map(t => (
                                    <View key={t.transporteId} style={styles.tCard}>
                                        <View>
                                            <Text style={styles.tPlaca}>{t.placaVehiculo}</Text>
                                            <Text style={styles.tInfo}>
                                                Salida: {formatFecha(t.fechaHoraSalida)}
                                                {t.temperaturaInicio != null ? ` | ${t.temperaturaInicio}°C` : ""}
                                            </Text>
                                            {t.fechaHoraEntrada && (
                                                <Text style={styles.tInfo}>
                                                    Entrada: {formatFecha(t.fechaHoraEntrada)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: "#27ae60" }]}>
                                            <Text style={styles.badgeText}>Completado</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </>
                    )}
                    ListEmptyComponent={loading ? null : <Text style={styles.emptyText}>Sin transportes</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.tCard}
                            onPress={() => setSelectedTransporte(item)}
                        >
                            <View>
                                <Text style={styles.tPlaca}>{item.placaVehiculo}</Text>
                                <Text style={styles.tInfo}>
                                    Salida: {formatFecha(item.fechaHoraSalida)}
                                    {item.temperaturaInicio != null ? ` | ${item.temperaturaInicio}°C` : ""}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: "#e67e22" }]}>
                                <Text style={styles.badgeText}>En tránsito</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <Modal
                visible={!!selectedTransporte}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedTransporte(null)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedTransporte(null)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Registrar llegada</Text>
                        <Text style={styles.modalSub}>Transporte: {selectedTransporte?.placaVehiculo}</Text>
                        <Text style={styles.modalInfo}>
                            Salida: {formatFecha(selectedTransporte?.fechaHoraSalida ?? null)}
                        </Text>
                        <TouchableOpacity
                            style={[styles.completarBtn, editing && { opacity: 0.5 }]}
                            onPress={handleCompletar}
                            disabled={editing}
                        >
                            {editing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.completarBtnText}>Registrar llegada</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ResponseModal
                visible={responseModal.visible}
                type={responseModal.type}
                title={responseModal.title}
                message={responseModal.message}
                onClose={() => setResponseModal(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "rgba(255,255,255,0.97)",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    list: { padding: 20, gap: 8, paddingBottom: 40 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 8 },
    emptyText: { textAlign: "center", color: "#aaa", fontSize: 14, paddingVertical: 12 },
    tCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
        marginBottom: 8,
    },
    tPlaca: { fontSize: 16, fontWeight: "bold", color: "#222" },
    tInfo: { fontSize: 12, color: "#888", marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        gap: 12,
        marginHorizontal: 30,
        width: "85%",
    },
    modalClose: { alignSelf: "flex-end" },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    modalSub: { fontSize: 15, color: "#555" },
    modalInfo: { fontSize: 13, color: "#888" },
    completarBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#2980b9",
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 20,
        marginTop: 8,
    },
    completarBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})
