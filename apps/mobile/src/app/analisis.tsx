import { useState, useEffect } from "react"
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    FlatList,
} from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ResponseModal from "../components/ResponseModal"
import {
    getParametrosByCentro,
    type ParametroCalidadDto,
} from "../infrastructure/parametrosApi"
import {
    getLotesByCentro,
    getMuestrasByLote,
    createMuestra,
    createAnalisis,
    createResultado,
    type LoteDto,
    type MuestraConEstadoDto,
} from "../infrastructure/analisisApi"

type Step = "lotes" | "muestras" | "form"

export default function AnalisisScreen() {
    const [step, setStep] = useState<Step>("lotes")
    const [lotes, setLotes] = useState<LoteDto[]>([])
    const [parametros, setParametros] = useState<ParametroCalidadDto[]>([])
    const [centroId, setCentroId] = useState<number | null>(null)
    const [usuarioId, setUsuarioId] = useState<number | null>(null)
    const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null)
    const [muestras, setMuestras] = useState<MuestraConEstadoDto[]>([])
    const [selectedMuestra, setSelectedMuestra] = useState<MuestraConEstadoDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [muestraLoading, setMuestraLoading] = useState(false)
    const [observaciones, setObservaciones] = useState("")
    const [valores, setValores] = useState<Record<number, string>>({})
    const [saving, setSaving] = useState(false)
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    useEffect(() => {
        loadUser()
    }, [])

    const showModal = (type: "success" | "error", title: string, message: string, onClose?: () => void) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
        if (onClose) setModalCallback(() => onClose);
    };

    const loadUser = async () => {
        try {
            const userJson = await AsyncStorage.getItem("usuario")
            if (!userJson) return
            const user = JSON.parse(userJson)
            const id = user.centroAcopioId
            const uid = user.id ?? user.usuarioId
            if (!id) {
                showModal("error", "Error", "No tienes un centro de acopio asignado.")
                return
            }
            setCentroId(id)
            setUsuarioId(uid)

            const [lotesData, paramsData] = await Promise.all([
                getLotesByCentro(id),
                getParametrosByCentro(id),
            ])
            setLotes(lotesData)
            setParametros(paramsData)
        } catch {
            showModal("error", "Error", "No se pudieron cargar los datos.")
        } finally {
            setLoading(false)
        }
    }

    const selectLote = async (lote: LoteDto) => {
        setSelectedLote(lote)
        setSelectedMuestra(null)
        setMuestraLoading(true)
        try {
            const m = await getMuestrasByLote(lote.loteId)
            setMuestras(m)
            setStep("muestras")
        } catch {
            setMuestras([])
            setStep("muestras")
        } finally {
            setMuestraLoading(false)
        }
    }

    const handleNuevaMuestra = async () => {
        if (!selectedLote || !usuarioId) return
        setMuestraLoading(true)
        try {
            const m = await createMuestra(selectedLote.loteId, usuarioId)
            setMuestras(prev => [{
                muestraId: m.muestraId,
                loteId: m.loteId,
                tecnicoPorUsuarioId: m.tecnicoPorUsuarioId,
                fechaHoraToma: m.fechaHoraToma,
                tieneAnalisis: false,
            }, ...prev])
        } catch (e: any) {
            showModal("error", "Error", e?.message ?? "No se pudo crear la muestra.")
        } finally {
            setMuestraLoading(false)
        }
    }

    const selectMuestra = (m: MuestraConEstadoDto) => {
        setSelectedMuestra(m)
        setValores({})
        setObservaciones("")
        setStep("form")
    }

    const handleSubmit = async () => {
        if (!selectedLote || !usuarioId || !centroId || !selectedMuestra) return
        if (parametros.length === 0) {
            showModal("error", "Validación", "No hay parámetros definidos para este centro.")
            return
        }

        const missing = parametros.filter((p) => !valores[p.parametroId] && valores[p.parametroId] !== "0")
        if (missing.length > 0) {
            showModal("error", "Validación", `Faltan valores para: ${missing.map((p) => p.nombre).join(", ")}`)
            return
        }

        setSaving(true)
        try {
            const analisis = await createAnalisis(selectedMuestra.muestraId, observaciones)

            for (const p of parametros) {
                await createResultado(
                    analisis.analisisId,
                    p.parametroId,
                    Number(valores[p.parametroId]),
                    null,
                )
            }

            showModal("success", "Éxito", "Análisis registrado correctamente.", () => router.back())
        } catch (error: any) {
            showModal("error", "Error", error.message ?? "No se pudo registrar el análisis.")
            setSaving(false)
        }
    }

    const pendientes = muestras.filter(m => !m.tieneAnalisis)
    const completadas = muestras.filter(m => m.tieneAnalisis)

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#555" />
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (step === "muestras") { setStep("lotes"); setSelectedLote(null); setMuestras([]) }
                    else if (step === "form") { setStep("muestras"); setSelectedMuestra(null) }
                    else router.back()
                }} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === "lotes" ? "Seleccionar lote" : step === "muestras" ? "Muestras" : "Nuevo análisis"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {step === "lotes" && (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {lotes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="flask-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No hay lotes disponibles con transporte completado.</Text>
                        </View>
                    ) : (
                        lotes.map((l) => (
                            <TouchableOpacity
                                key={l.loteId}
                                style={styles.loteCard}
                                onPress={() => selectLote(l)}
                            >
                                <Text style={styles.loteTitle}>Lote #{l.loteId}</Text>
                                <Text style={styles.loteDetail}>Volumen: {l.volumenCapturadoLitros} L</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {step === "muestras" && (
                <View style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={styles.addMuestraBtn}
                        onPress={handleNuevaMuestra}
                        disabled={muestraLoading}
                    >
                        {muestraLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <Text style={styles.addMuestraBtnText}>Nueva muestra</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.listContainer}>
                        {muestras.length === 0 && !muestraLoading && (
                            <View style={styles.emptyState}>
                                <Ionicons name="flask-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No hay muestras para este lote. Crea una nueva.</Text>
                            </View>
                        )}

                        {pendientes.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Pendientes de análisis</Text>
                                {pendientes.map(m => (
                                    <TouchableOpacity
                                        key={m.muestraId}
                                        style={styles.muestraCard}
                                        onPress={() => selectMuestra(m)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.muestraTitle}>Muestra #{m.muestraId}</Text>
                                            <Text style={styles.muestraDate}>
                                                {new Date(m.fechaHoraToma).toLocaleString("es-CO")}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: "#e67e22" }]}>
                                            <Text style={styles.badgeText}>Pendiente</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {completadas.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Analizadas</Text>
                                {completadas.map(m => (
                                    <View key={m.muestraId} style={styles.muestraCard}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.muestraTitle}>Muestra #{m.muestraId}</Text>
                                            <Text style={styles.muestraDate}>
                                                {new Date(m.fechaHoraToma).toLocaleString("es-CO")}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: "#27ae60" }]}>
                                            <Text style={styles.badgeText}>Analizada</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>
            )}

            {step === "form" && (
                <ScrollView contentContainerStyle={styles.listContainer} keyboardShouldPersistTaps="handled">
                    <Text style={styles.sectionTitle}>
                        Lote #{selectedLote?.loteId} — Muestra #{selectedMuestra?.muestraId}
                    </Text>
                    <Text style={styles.formHint}>Ingresa los valores del análisis</Text>

                    {parametros.map((p) => (
                        <View key={p.parametroId} style={styles.paramField}>
                            <Text style={styles.paramLabel}>
                                {p.nombre}
                                {p.unidad ? <Text style={styles.paramUnit}> ({p.unidad})</Text> : null}
                            </Text>
                            {p.descripcion && (
                                <Text style={styles.paramHint}>{p.descripcion}</Text>
                            )}
                            <TextInput
                                style={styles.input}
                                value={valores[p.parametroId] ?? ""}
                                onChangeText={(v) => setValores((prev) => ({ ...prev, [p.parametroId]: v }))}
                                placeholder={p.valorMinimo != null && p.valorMaximo != null
                                    ? `Óptimo: ${p.valorMinimo} - ${p.valorMaximo}`
                                    : "Ingresa el valor"}
                                placeholderTextColor="#999"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    ))}

                    <Text style={styles.label}>Observaciones</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={observaciones}
                        onChangeText={setObservaciones}
                        placeholder="Notas adicionales sobre el análisis..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Registrar análisis</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            {saving && (
                <View style={StyleSheet.absoluteFill}>
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#2980b9" />
                        <Text style={styles.overlayText}>Guardando análisis...</Text>
                    </View>
                </View>
            )}
            <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => { setModalVisible(false); modalCallback?.(); setModalCallback(null); }} />
        </View>
    )
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: "#fff",
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
    listContainer: { padding: 16, paddingBottom: 40 },
    emptyState: { alignItems: "center", marginTop: 80 },
    emptyText: { fontSize: 14, color: "#999", textAlign: "center", marginTop: 12 },
    loteCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    loteTitle: { fontSize: 16, fontWeight: "bold", color: "#222" },
    loteDetail: { fontSize: 13, color: "#666", marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
    formHint: { fontSize: 13, color: "#888", marginBottom: 16, marginTop: -8 },
    paramField: { marginBottom: 14 },
    paramLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
    paramUnit: { fontSize: 12, fontWeight: "normal", color: "#888" },
    paramHint: { fontSize: 12, color: "#888", fontStyle: "italic", marginBottom: 4, marginTop: 2 },
    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#222",
        borderWidth: 1,
        borderColor: "#ddd",
        marginTop: 4,
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4, marginTop: 16 },
    submitBtn: {
        backgroundColor: "#27ae60",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24,
    },
    submitText: { fontWeight: "bold", color: "#fff", fontSize: 16 },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.85)",
        alignItems: "center",
        justifyContent: "center",
    },
    overlayText: { marginTop: 12, fontSize: 14, color: "#555" },
    addMuestraBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#2980b9",
        marginHorizontal: 16,
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignSelf: "flex-start",
    },
    addMuestraBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    muestraCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    muestraTitle: { fontSize: 15, fontWeight: "bold", color: "#222" },
    muestraDate: { fontSize: 12, color: "#888", marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
})
