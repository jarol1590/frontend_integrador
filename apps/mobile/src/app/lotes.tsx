import { useState, useEffect, useRef, useCallback } from "react"
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
import QRCode from "react-native-qrcode-svg"
import { Paths, File, EncodingType } from "expo-file-system"
import * as Sharing from "expo-sharing"
import ResponseModal from "../components/ResponseModal"
import { getMiPerfil, ProductorPerfil } from "../infrastructure/dashboardApi"
import { getLotesByFinca, LoteDto } from "../infrastructure/ordenosApi"

function status(lote: LoteDto | null): { label: string; color: string } {
    if (!lote) return { label: "Desconocido", color: "#999" }
    if (lote.centroAcopioId == null && lote.transporteId == null)
        return { label: "Abierto", color: "#6eaaff" }
    if (lote.transporteFechaHoraEntrada != null)
        return { label: "Entregado", color: "#27ae60" }
    return { label: "En tránsito", color: "#e67e22" }
}

export default function Lotes() {
    const [perfil, setPerfil] = useState<ProductorPerfil | null>(null)
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null)
    const [responseModal, setResponseModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })
    const qrRef = useRef<any>(null)

    const loadLotes = useCallback(async () => {
        setLoading(true)
        try {
            const p = await getMiPerfil()
            setPerfil(p)
            const finca = p.fincas?.[0]
            if (finca) {
                const all = await getLotesByFinca(finca.fincaId)
                setLotes(all)
            }
        } catch {
            setResponseModal({ visible: true, type: "error", title: "Error", message: "No se pudieron cargar los lotes" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadLotes() }, [loadLotes])

    const abiertos = lotes.filter(l => l.centroAcopioId === null && l.transporteId === null)
    const enTransito = lotes.filter(l => l.centroAcopioId !== null && l.transporteId !== null && l.centroAcopioId !== null)
    const completados = lotes.filter(l => l.centroAcopioId !== null && l.transporteId !== null)

    const handleCompartirQR = async () => {
        if (!qrRef.current || !selectedLote) return
        try {
            const dataUrl = await qrRef.current?.toDataURL()
            if (!dataUrl) return
            const base64 = dataUrl.split(",")[1]
            const file = new File(Paths.document, `lote-${selectedLote.loteId}.png`)
            await file.write(base64, { encoding: EncodingType.Base64 })
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri, { mimeType: "image/png" })
            }
        } catch {
            setResponseModal({ visible: true, type: "error", title: "Error", message: "No se pudo compartir el QR" })
        }
    }

    const finca = perfil?.fincas?.[0]

    const renderLote = (item: LoteDto) => {
        const s = status(item)
        return (
            <TouchableOpacity style={styles.loteCard} onPress={() => setSelectedLote(item)}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.loteTitle}>{item.codigo ?? `Lote #${item.loteId}`}</Text>
                    <Text style={styles.loteInfo}>{item.volumenCapturadoLitros} L</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.color }]}>
                    <Text style={styles.badgeText}>{s.label}</Text>
                </View>
                {s.label === "Abierto" && (
                    <Ionicons name="qr-code-outline" size={22} color={s.color} style={{ marginLeft: 8 }} />
                )}
            </TouchableOpacity>
        )
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
                <Text style={styles.headerTitle}>Mis lotes</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={lotes}
                    keyExtractor={i => i.loteId.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No hay lotes registrados</Text>}
                    renderItem={({ item }) => renderLote(item)}
                />
            )}

            <Modal
                visible={!!selectedLote}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedLote(null)}
            >
                <View style={styles.qrOverlay}>
                    <View style={styles.qrModal}>
                        <TouchableOpacity style={styles.qrClose} onPress={() => setSelectedLote(null)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.qrTitle}>{selectedLote?.codigo ?? `Lote #${selectedLote?.loteId}`}</Text>
                        <Text style={styles.qrSub}>{selectedLote?.volumenCapturadoLitros} L</Text>
                        <Text style={styles.qrSub}>{status(selectedLote!).label}</Text>
                        <View style={styles.qrWrapper}>
                            {selectedLote && (
                                <QRCode
                                    value={JSON.stringify({ idLote: selectedLote.loteId, idFinca: finca?.fincaId })}
                                    size={200}
                                    backgroundColor="white"
                                    getRef={(ref) => { qrRef.current = ref }}
                                />
                            )}
                        </View>
                        <TouchableOpacity style={styles.shareBtn} onPress={handleCompartirQR}>
                            <Ionicons name="share-outline" size={18} color="#fff" />
                            <Text style={styles.shareBtnText}>Compartir QR</Text>
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
    list: { padding: 20, gap: 12, paddingBottom: 40 },
    emptyText: { textAlign: "center", color: "#aaa", fontSize: 15, marginTop: 40 },
    loteCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
    },
    loteTitle: { fontSize: 16, fontWeight: "bold", color: "#222" },
    loteInfo: { fontSize: 13, color: "#888", marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
    qrOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    qrModal: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        gap: 12,
        marginHorizontal: 30,
    },
    qrClose: { alignSelf: "flex-end" },
    qrTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    qrSub: { fontSize: 14, color: "#666" },
    qrWrapper: {
        padding: 14,
        backgroundColor: "#fff",
        borderRadius: 14,
        elevation: 2,
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#27ae60",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 18,
    },
    shareBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
})
