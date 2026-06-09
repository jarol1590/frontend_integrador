import { useState, useEffect, useRef, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    ImageBackground,
    Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import QRCode from "react-native-qrcode-svg"
import { Paths, File, EncodingType } from "expo-file-system"
import * as Sharing from "expo-sharing"
import ResponseModal from "../components/ResponseModal"
import { getMiPerfil, ProductorPerfil } from "../infrastructure/dashboardApi"
import { createOrdeno, createLote, getLotesByFinca, getOrdenosByFinca, LoteDto, OrdenoDto } from "../infrastructure/ordenosApi"

type Screen = "list" | "create" | "qr"

export default function Ordenos() {
    const [perfil, setPerfil] = useState<ProductorPerfil | null>(null)
    const [ordenos, setOrdenos] = useState<OrdenoDto[]>([])
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [loading, setLoading] = useState(true)
    const [screen, setScreen] = useState<Screen>("list")
    const [volumen, setVolumen] = useState("")
    const [creating, setCreating] = useState(false)
    const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null)
    const [responseModal, setResponseModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })
    const qrRef = useRef<any>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const p = await getMiPerfil()
            setPerfil(p)
            const finca = p.fincas?.[0]
            if (finca) {
                console.log("[DEBUG] Cargando ordeños para finca", finca.fincaId)
                const [ords, lots] = await Promise.all([
                    getOrdenosByFinca(finca.fincaId),
                    getLotesByFinca(finca.fincaId),
                ])
                console.log("[DEBUG] Ordeños encontrados:", ords.length)
                console.log("[DEBUG] Lotes encontrados:", lots.length)
                setOrdenos(ords)
                setLotes(lots)
            }
        } catch (e) {
            console.error("[DEBUG] Error cargando datos:", e)
            setResponseModal({ visible: true, type: "error", title: "Error", message: "No se pudieron cargar los datos" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const finca = perfil?.fincas?.[0]

    const handleCrearOrdeneo = async () => {
        if (!volumen || !finca) return
        setCreating(true)
        try {
            const ordeno = await createOrdeno(finca.fincaId, parseFloat(volumen))
            console.log("[DEBUG] Ordeño creado:", ordeno.ordenoId)
            const nuevoLote = await createLote(ordeno.ordenoId, parseFloat(volumen))
            console.log("[DEBUG] Lote creado:", nuevoLote.loteId)
            setVolumen("")
            setScreen("list")
            await loadData()
            setSelectedLote(nuevoLote)
        } catch (e: any) {
            console.error("[DEBUG] Error creando ordeño:", e)
            const msg = e?.response?.data?.errors ?? e?.message ?? "Error al crear el ordeño"
            setResponseModal({ visible: true, type: "error", title: "Error", message: msg })
        } finally {
            setCreating(false)
        }
    }

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

    const ordenoConLote = (ordenoId: number) => lotes.find(l => l.ordenoId === ordenoId)

    const handleCrearLoteParaOrdeno = async (ordenoId: number, volumenLitros: number) => {
        try {
            const nuevoLote = await createLote(ordenoId, volumenLitros)
            await loadData()
            setSelectedLote(nuevoLote)
        } catch (e: any) {
            console.error("[DEBUG] Error creando lote para ordeño:", e)
            const msg = e?.message ?? "Error al crear el lote"
            setResponseModal({ visible: true, type: "error", title: "Error", message: msg })
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
                <Text style={styles.headerTitle}>
                    {screen === "create" ? "Nuevo ordeño" : "Mis ordeños"}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {screen === "create" ? (
                <View style={styles.content}>
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Registrar ordeño</Text>
                        <Text style={styles.formLabel}>Finca: {finca?.nombre ?? "---"}</Text>
                        <Text style={styles.formLabel}>Volumen capturado (litros)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="decimal-pad"
                            placeholder="Ej: 150.5"
                            placeholderTextColor="#aaa"
                            value={volumen}
                            onChangeText={setVolumen}
                        />
                        <TouchableOpacity
                            style={[styles.submitBtn, (!volumen || creating) && { opacity: 0.5 }]}
                            onPress={handleCrearOrdeneo}
                            disabled={!volumen || creating}
                        >
                            {creating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Registrar ordeño</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setScreen("list")} style={{ paddingVertical: 8 }}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setScreen("create")}>
                        <Ionicons name="add-circle-outline" size={22} color="#fff" />
                        <Text style={styles.addBtnText}>Nuevo ordeño</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={ordenos}
                            keyExtractor={i => i.ordenoId.toString()}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={<Text style={styles.emptyText}>No hay ordeños registrados</Text>}
                            renderItem={({ item }) => {
                                const lote = ordenoConLote(item.ordenoId)
                                return (
                                    <TouchableOpacity
                                        style={styles.ordenoCard}
                                        onPress={() => lote && setSelectedLote(lote)}
                                        disabled={!lote}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.ordenoTitle}>Ordeño #{item.ordenoId}</Text>
                                            <Text style={styles.ordenoInfo}>
                                                {new Date(item.fechaHoraInicio).toLocaleDateString("es-CO", {
                                                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                })}
                                            </Text>
                                            <Text style={styles.ordenoInfo}>{item.volumenLitros} L</Text>
                                        </View>
                                        {lote ? (
                                            <Ionicons name="qr-code-outline" size={28} color="#6eaaff" />
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handleCrearLoteParaOrdeno(item.ordenoId, item.volumenLitros)}
                                                style={styles.addLoteBtn}
                                            >
                                                <Ionicons name="add-circle" size={20} color="#27ae60" />
                                                <Text style={styles.addLoteText}>Crear lote</Text>
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                )
                            }}
                        />
                    )}
                </>
            )}

            {/* QR MODAL */}
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
                        <Text style={styles.qrTitle}>Lote #{selectedLote?.loteId}</Text>
                        <Text style={styles.qrSub}>Volumen: {selectedLote?.volumenCapturadoLitros} L</Text>
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
                        <Text style={styles.qrHint}>Comparte este QR para registrar el transporte</Text>
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
    content: { padding: 20, gap: 20, paddingBottom: 40 },
    list: { padding: 20, gap: 10, paddingBottom: 40 },
    emptyText: { textAlign: "center", color: "#aaa", fontSize: 15, marginTop: 40 },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#6eaaff",
        marginHorizontal: 20,
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignSelf: "flex-start",
    },
    addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    formCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 20,
        gap: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
    formLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: "#222",
        backgroundColor: "#f9f9f9",
    },
    submitBtn: {
        backgroundColor: "#6eaaff",
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 4,
    },
    submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    cancelText: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 4 },
    ordenoCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
    },
    ordenoTitle: { fontSize: 16, fontWeight: "bold", color: "#222" },
    ordenoInfo: { fontSize: 12, color: "#888", marginTop: 2 },
    addLoteBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#27ae60",
    },
    addLoteText: { fontSize: 12, color: "#27ae60", fontWeight: "600" },
    // QR Modal
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
    qrWrapper: { padding: 14, backgroundColor: "#fff", borderRadius: 14, elevation: 2 },
    qrHint: { fontSize: 12, color: "#aaa", textAlign: "center" },
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
