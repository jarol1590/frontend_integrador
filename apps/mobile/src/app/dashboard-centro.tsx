import { useState, useEffect } from "react"
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ImageBackground,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { HttpClient } from "@proyectointegrador/shared-infra"
import ChatModal from "../components/ChatModal"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

export default function DashboardCentro() {
    const [userName, setUserName] = useState("")
    const [userRole, setUserRole] = useState("")
    const [centroNombre, setCentroNombre] = useState("")
    const [centroDireccion, setCentroDireccion] = useState("")
    const [chatVisible, setChatVisible] = useState(false)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const [userJson, token] = await Promise.all([
                AsyncStorage.getItem("usuario"),
                AsyncStorage.getItem("token"),
            ])
            if (!userJson) return
            const user = JSON.parse(userJson)
            setUserName(user.email ?? "")
            setUserRole(user.rolNombre ?? "")

            if (user.centroAcopioId && token) {
                const http = new HttpClient(API_URL, token)
                const res = await http.get<{ response?: { nombre: string; direccion?: string } }>(
                    `/centros-acopio/${user.centroAcopioId}`
                )
                const centro = (res.data as any)?.response ?? res.data
                setCentroNombre(centro?.nombre ?? "Centro de acopio")
                setCentroDireccion(centro?.direccion ?? "")
            }
        } catch {
            // silent
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [{ scale: 1.2 }, { translateY: 285 }],
                    opacity: 0.2,
                }}
            />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="business-outline" size={24} color="#555" />
                    </View>
                    <View>
                        <Text style={styles.greeting}>Centro de acopio</Text>
                        <Text style={styles.userName}>{userName}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/qr-scanner" as any)}>
                        <Ionicons name="qr-code-outline" size={22} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* CENTRO INFO */}
                {centroNombre ? (
                    <View style={styles.centroCard}>
                        <Ionicons name="business" size={32} color="#2980b9" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.centroNombre}>{centroNombre}</Text>
                            {centroDireccion ? (
                                <Text style={styles.centroDireccion}>{centroDireccion}</Text>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                {/* ACCIONES */}
                <Text style={styles.sectionTitle}>Gestión</Text>

                {userRole !== "Trabajador Centro de acopio" ? (
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/parametros" as any)}>
                        <View style={[styles.actionIcon, { backgroundColor: "#e8f4f8" }]}>
                            <Ionicons name="flask-outline" size={24} color="#2980b9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>Parámetros de calidad</Text>
                            <Text style={styles.actionDesc}>Agregar, editar o quitar campos del formulario</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/analisis" as any)}>
                    <View style={[styles.actionIcon, { backgroundColor: "#e8f8e8" }]}>
                        <Ionicons name="analytics-outline" size={24} color="#27ae60" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Nuevo análisis</Text>
                        <Text style={styles.actionDesc}>Registrar valores de calidad para un lote</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/transportes" as any)}>
                    <View style={[styles.actionIcon, { backgroundColor: "#fef3e2" }]}>
                        <Ionicons name="car-outline" size={24} color="#e67e22" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Transportes</Text>
                        <Text style={styles.actionDesc}>Ver transportes abiertos y completados</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* CALENDARIO */}
                <Text style={styles.sectionTitle}>Calendario</Text>
                <View style={styles.placeholderCard}>
                    <Ionicons name="calendar-outline" size={32} color="#ccc" />
                    <Text style={styles.placeholderText}>
                        Calendario de actividades próximamente
                    </Text>
                </View>
            </ScrollView>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
                    <Ionicons name="home" size={24} color="#000" />
                    <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabCenter} onPress={() => setChatVisible(true)}>
                    <Image
                        source={require("../../../../packages/assets/images/CallCow.png")}
                        style={styles.tabCowImage}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
                    <Ionicons name="person-outline" size={24} color="#888" />
                    <Text style={styles.tabLabel}>User</Text>
                </TouchableOpacity>
            </View>

            <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "rgba(255,255,255,0.97)",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatarContainer: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    greeting: { fontSize: 12, color: "#888" },
    userName: { fontSize: 16, fontWeight: "bold", color: "#222" },
    headerRight: { flexDirection: "row", gap: 10 },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 30 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: -8 },
    centroCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    centroNombre: { fontSize: 18, fontWeight: "bold", color: "#222" },
    centroDireccion: { fontSize: 13, color: "#888", marginTop: 2 },
    actionCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    actionIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
    },
    actionTitle: { fontSize: 15, fontWeight: "bold", color: "#222" },
    actionDesc: { fontSize: 12, color: "#888", marginTop: 2 },
    placeholderCard: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        gap: 8,
    },
    placeholderText: { fontSize: 13, color: "#aaa", textAlign: "center" },
    bottomBar: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingVertical: 10,
        paddingHorizontal: 30,
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        height: 70,
    },
    tabItem: { alignItems: "center", gap: 4 },
    tabLabel: { fontSize: 11, color: "#888" },
    tabLabelActive: { color: "#000", fontWeight: "bold" },
    tabCenter: {
        width: 65,
        height: 65,
        borderRadius: 33,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 35,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "#fff",
    },
    tabCowImage: { width: "100%", height: "100%", resizeMode: "cover" },
})
