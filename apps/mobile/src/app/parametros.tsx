import { useState, useEffect, useCallback } from "react"
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native"
import ResponseModal from "../components/ResponseModal"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
    getParametrosByCentro,
    createParametro,
    updateParametro,
    deleteParametro,
    type ParametroCalidadDto,
    type CreateParametroDto,
    type UpdateParametroDto,
} from "../infrastructure/parametrosApi"

export default function ParametrosScreen() {
    const [parametros, setParametros] = useState<ParametroCalidadDto[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [centroId, setCentroId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<ParametroCalidadDto | null>(null)
    const [saving, setSaving] = useState(false)
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    // Form fields
    const [nombre, setNombre] = useState("")
    const [unidad, setUnidad] = useState("")
    const [valorMinimo, setValorMinimo] = useState("")
    const [valorMaximo, setValorMaximo] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [orden, setOrden] = useState("")

    useEffect(() => {
        loadUserAndParams()
    }, [])

    const showModal = (type: "success" | "error", title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const loadUserAndParams = async () => {
        try {
            const userJson = await AsyncStorage.getItem("usuario")
            if (!userJson) return
            const user = JSON.parse(userJson)
            const id = user.centroAcopioId
            if (!id) {
                showModal("error", "Error", "No tienes un centro de acopio asignado.")
                return
            }
            setCentroId(id)
            await fetchParams(id)
        } catch {
            showModal("error", "Error", "No se pudo cargar la información del usuario.")
        } finally {
            setLoading(false)
        }
    }

    const fetchParams = async (id: number) => {
        try {
            const data = await getParametrosByCentro(id)
            setParametros(data)
        } catch {
            showModal("error", "Error", "No se pudieron cargar los parámetros.")
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        if (centroId) await fetchParams(centroId)
        setRefreshing(false)
    }, [centroId])

    const resetForm = () => {
        setNombre("")
        setUnidad("")
        setValorMinimo("")
        setValorMaximo("")
        setDescripcion("")
        setOrden(String(parametros.length + 1))
        setEditing(null)
    }

    const openEdit = (p: ParametroCalidadDto) => {
        setNombre(p.nombre)
        setUnidad(p.unidad ?? "")
        setValorMinimo(p.valorMinimo != null ? String(p.valorMinimo) : "")
        setValorMaximo(p.valorMaximo != null ? String(p.valorMaximo) : "")
        setDescripcion(p.descripcion ?? "")
        setOrden(String(p.orden))
        setEditing(p)
        setShowForm(true)
    }

    const openNew = () => {
        resetForm()
        setOrden(String(parametros.length + 1))
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!nombre.trim()) {
            showModal("error", "Validación", "El nombre del parámetro es obligatorio.")
            return
        }
        if (!centroId) return

        setSaving(true)
        try {
            const base = {
                nombre: nombre.trim(),
                unidad: unidad.trim() || null,
                valorMinimo: valorMinimo ? Number(valorMinimo) : null,
                valorMaximo: valorMaximo ? Number(valorMaximo) : null,
                descripcion: descripcion.trim() || null,
                orden: Number(orden) || parametros.length + 1,
            }

            if (editing) {
                await updateParametro(editing.parametroId, base as UpdateParametroDto)
            } else {
                await createParametro({ ...base, centroAcopioId: centroId } as CreateParametroDto)
            }

            setShowForm(false)
            resetForm()
            await fetchParams(centroId)
        } catch (error: any) {
            showModal("error", "Error", error.message ?? "No se pudo guardar el parámetro.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (p: ParametroCalidadDto) => {
        Alert.alert(
            "Eliminar parámetro",
            `¿Eliminar "${p.nombre}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteParametro(p.parametroId)
                            if (centroId) await fetchParams(centroId)
                        } catch (error: any) {
                            showModal("error", "Error", error.message ?? "No se pudo eliminar.")
                        }
                    },
                },
            ],
        )
    }

    const moveUp = async (index: number) => {
        if (index === 0) return
        const list = [...parametros]
        const temp = list[index]
        list[index] = list[index - 1]
        list[index - 1] = temp

        const updated = list.map((p, i) => ({ ...p, orden: i + 1 }))
        setParametros(updated)

        try {
            for (const p of updated) {
                await updateParametro(p.parametroId, {
                    nombre: p.nombre,
                    unidad: p.unidad,
                    valorMinimo: p.valorMinimo,
                    valorMaximo: p.valorMaximo,
                    descripcion: p.descripcion,
                    orden: p.orden,
                })
            }
        } catch {
            if (centroId) await fetchParams(centroId)
        }
    }

    const moveDown = async (index: number) => {
        if (index === parametros.length - 1) return
        const list = [...parametros]
        const temp = list[index]
        list[index] = list[index + 1]
        list[index + 1] = temp

        const updated = list.map((p, i) => ({ ...p, orden: i + 1 }))
        setParametros(updated)

        try {
            for (const p of updated) {
                await updateParametro(p.parametroId, {
                    nombre: p.nombre,
                    unidad: p.unidad,
                    valorMinimo: p.valorMinimo,
                    valorMaximo: p.valorMaximo,
                    descripcion: p.descripcion,
                    orden: p.orden,
                })
            }
        } catch {
            if (centroId) await fetchParams(centroId)
        }
    }

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
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Parámetros de calidad</Text>
                <View style={{ width: 40 }} />
            </View>

            {showForm ? (
                <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
                    <Text style={styles.formTitle}>
                        {editing ? "Editar parámetro" : "Nuevo parámetro"}
                    </Text>

                    <Text style={styles.label}>Nombre *</Text>
                    <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Acidez" placeholderTextColor="#999" />

                    <Text style={styles.label}>Unidad</Text>
                    <TextInput style={styles.input} value={unidad} onChangeText={setUnidad} placeholder="Ej: g/L, pH, °C" placeholderTextColor="#999" />

                    <Text style={styles.label}>Valor mínimo óptimo</Text>
                    <TextInput style={styles.input} value={valorMinimo} onChangeText={setValorMinimo} placeholder="Ej: 0.5" placeholderTextColor="#999" keyboardType="decimal-pad" />

                    <Text style={styles.label}>Valor máximo óptimo</Text>
                    <TextInput style={styles.input} value={valorMaximo} onChangeText={setValorMaximo} placeholder="Ej: 1.5" placeholderTextColor="#999" keyboardType="decimal-pad" />

                    <Text style={styles.label}>Orden</Text>
                    <TextInput style={styles.input} value={orden} onChangeText={setOrden} placeholder="Posición en el formulario" placeholderTextColor="#999" keyboardType="number-pad" />

                    <Text style={styles.label}>Descripción / Instrucción</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={descripcion}
                        onChangeText={setDescripcion}
                        placeholder="Describe qué debe medir el trabajador..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.formButtons}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => { setShowForm(false); resetForm() }}
                        >
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Guardar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {parametros.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="flask-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    No hay parámetros definidos.{"\n"}Agrega el primero.
                                </Text>
                            </View>
                        ) : (
                            parametros.map((p, index) => (
                                <View key={p.parametroId} style={styles.paramCard}>
                                    <View style={styles.paramHeader}>
                                        <Text style={styles.paramOrder}>#{p.orden}</Text>
                                        <Text style={styles.paramName}>{p.nombre}</Text>
                                    </View>
                                    {p.unidad && <Text style={styles.paramDetail}>Unidad: {p.unidad}</Text>}
                                    {(p.valorMinimo != null || p.valorMaximo != null) && (
                                        <Text style={styles.paramDetail}>
                                            Rango óptimo: {p.valorMinimo ?? "—"} - {p.valorMaximo ?? "—"}
                                        </Text>
                                    )}
                                    {p.descripcion && (
                                        <Text style={styles.paramDesc}>{p.descripcion}</Text>
                                    )}
                                    <View style={styles.paramActions}>
                                        <TouchableOpacity onPress={() => moveUp(index)} style={styles.actionBtn}>
                                            <Ionicons name="chevron-up" size={18} color="#555" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => moveDown(index)} style={styles.actionBtn}>
                                            <Ionicons name="chevron-down" size={18} color="#555" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openEdit(p)} style={styles.actionBtn}>
                                            <Ionicons name="pencil-outline" size={18} color="#2980b9" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(p)} style={styles.actionBtn}>
                                            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.fab} onPress={openNew}>
                        <Ionicons name="add" size={28} color="#fff" />
                    </TouchableOpacity>
                </>
            )}
            <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalVisible(false)} />
        </View>
    )
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    listContainer: { padding: 16, paddingBottom: 100 },
    formContainer: { padding: 16 },
    formTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 20, marginTop: 10 },
    label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4, marginTop: 12 },
    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#222",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    formButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 12 },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#ddd",
        alignItems: "center",
    },
    cancelBtnText: { fontWeight: "bold", color: "#555" },
    saveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#2980b9",
        alignItems: "center",
    },
    saveBtnText: { fontWeight: "bold", color: "#fff" },
    emptyState: { alignItems: "center", marginTop: 80 },
    emptyText: { fontSize: 14, color: "#999", textAlign: "center", marginTop: 12, lineHeight: 20 },
    paramCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    paramHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    paramOrder: { fontSize: 12, fontWeight: "bold", color: "#999", minWidth: 24 },
    paramName: { fontSize: 16, fontWeight: "bold", color: "#222" },
    paramDetail: { fontSize: 13, color: "#666", marginTop: 2 },
    paramDesc: { fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" },
    paramActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
    actionBtn: { padding: 6 },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2980b9",
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
})
