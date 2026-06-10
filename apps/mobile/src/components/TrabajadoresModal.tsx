import { useState, useEffect, useCallback } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { HttpClient } from "@proyectointegrador/shared-infra"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

interface Trabajador {
    usuarioId: number
    email: string
    nombre: string
    documento: string
    telefono: string | null
}

interface Props {
    visible: boolean
    centroAcopioId: number
    onClose: () => void
}

export default function TrabajadoresModal({ visible, centroAcopioId, onClose }: Props) {
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
    const [loading, setLoading] = useState(false)

    const loadTrabajadores = useCallback(async () => {
        setLoading(true)
        try {
            const token = await AsyncStorage.getItem("token")
            const http = new HttpClient(API_URL, token ?? undefined)
            const res = await http.get<any>(`/centros-acopio/${centroAcopioId}/trabajadores`)
            const data = (res.data as any)?.response ?? res.data
            setTrabajadores(Array.isArray(data) ? data : [])
        } catch {
            setTrabajadores([])
        } finally {
            setLoading(false)
        }
    }, [centroAcopioId])

    useEffect(() => {
        if (!visible) return
        loadTrabajadores()
    }, [visible, loadTrabajadores])

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Trabajadores del centro</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2980b9" style={{ margin: 40 }} />
                    ) : trabajadores.length === 0 ? (
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No hay trabajadores registrados</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={trabajadores}
                            keyExtractor={item => item.usuarioId.toString()}
                            style={styles.list}
                            renderItem={({ item }) => (
                                <View style={styles.trabajadorItem}>
                                    <View style={styles.avatar}>
                                        <Ionicons name="construct-outline" size={20} color="#555" />
                                    </View>
                                    <View style={styles.info}>
                                        <Text style={styles.nombre}>{item.nombre}</Text>
                                        <Text style={styles.detalle}>{item.documento}</Text>
                                        {item.telefono ? (
                                            <Text style={styles.detalle}>{item.telefono}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    card: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "80%",
        minHeight: 300,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: { fontSize: 18, fontWeight: "bold", color: "#222" },
    list: { flexGrow: 0 },
    trabajadorItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e8f4f8",
        alignItems: "center",
        justifyContent: "center",
    },
    info: { flex: 1 },
    nombre: { fontSize: 15, fontWeight: "bold", color: "#222" },
    detalle: { fontSize: 12, color: "#888", marginTop: 1 },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 12,
    },
    emptyText: { fontSize: 14, color: "#aaa" },
})
