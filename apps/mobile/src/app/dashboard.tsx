import { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ImageBackground,
    Modal,
    TextInput,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HttpClient } from "@proyectointegrador/shared-infra";
import ChatModal from "../components/ChatModal";

// ─── Configuración español ─────────────────────────────────
LocaleConfig.locales["es"] = {
    monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

// ─── Tipos ─────────────────────────────────────────────────
type Event = {
    id: string;
    date: string;
    type: string;
    note: string;
};

// ─── Opciones de eventos ───────────────────────────────────
const EVENT_OPTIONS = [
    { label: "🐄 Ordeño", value: "Ordeño" },
    { label: "💉 Vacunación", value: "Vacunación" },
    { label: "🌿 Alimentación", value: "Alimentación" },
    { label: "🧪 Análisis de calidad", value: "Análisis de calidad" },
    { label: "🚛 Recolección", value: "Recolección" },
    { label: "🔧 Mantenimiento", value: "Mantenimiento" },
    { label: "👨‍⚕️ Visita veterinaria", value: "Visita veterinaria" },
    { label: "📦 Entrega de insumos", value: "Entrega de insumos" },
    { label: "📝 Otra tarea", value: "Otra tarea" },
];

const STORAGE_KEY = "lacticontrol_events";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<"home" | "chat" | "user">("home");
    const [userName, setUserName] = useState("");

    // Calendario
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [note, setNote] = useState("");

    // ─── Cargar sesión del usuario ────────────────────────
    useEffect(() => {
        const loadUser = async () => {
            try {
                const [userJson, token] = await Promise.all([
                    AsyncStorage.getItem("usuario"),
                    AsyncStorage.getItem("token"),
                ]);
                if (userJson) {
                    const user = JSON.parse(userJson);
                    setUserName(user.email ?? "");
                    if (user.usuarioId && token) {
                        const http = new HttpClient(process.env.EXPO_PUBLIC_API_URL ?? "", token);
                        const res = await http.get<{ response: { productor?: { nombre: string } } }>(
                            `/usuarios/public/${user.usuarioId}`
                        );
                        if (res.data?.response?.productor?.nombre) {
                            setUserName(res.data.response.productor.nombre);
                        }
                    }
                }
            } catch (e) {
                console.log("Error cargando usuario:", e);
            }
        };
        loadUser();
    }, []);

    // ─── Cargar eventos de AsyncStorage ───────────────────
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) setEvents(JSON.parse(stored));
            } catch (e) {
                console.log("Error cargando eventos:", e);
            }
        };
        loadEvents();
    }, []);

    // ─── Guardar eventos en AsyncStorage ──────────────────
    const saveEvents = async (newEvents: Event[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
        } catch (e) {
            console.log("Error guardando eventos:", e);
        }
    };

    // ─── Agregar evento ───────────────────────────────────
    const handleAddEvent = async () => {
        if (!selectedType) return;
        const newEvent: Event = {
            id: Date.now().toString(),
            date: selectedDate,
            type: selectedType,
            note: note.trim(),
        };
        const updated = [...events, newEvent];
        setEvents(updated);
        await saveEvents(updated);
        setModalVisible(false);
        setSelectedType("");
        setNote("");
    };

    // ─── Eliminar evento ──────────────────────────────────
    const handleDeleteEvent = async (id: string) => {
        const updated = events.filter((e) => e.id !== id);
        setEvents(updated);
        await saveEvents(updated);
    };

    // ─── Marcar días con eventos en el calendario ─────────
    const markedDates: any = {};
    events.forEach((e) => {
        markedDates[e.date] = {
            marked: true,
            dotColor: "#6eaaff",
        };
    });
    if (selectedDate) {
        markedDates[selectedDate] = {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: "#6eaaff",
        };
    }

    // ─── Eventos del día seleccionado ─────────────────────
    const eventsOfDay = events.filter((e) => e.date === selectedDate);

    const [chatVisible, setChatVisible] = useState(false);

    const handleQR = () => router.push("/qr-scanner" as any);
    const handleNotifications = () => console.log("Notificaciones");
    const handleChat = () => setChatVisible(true);

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
                        <Ionicons name="person-outline" size={24} color="#555" />
                    </View>
                    <View>
                        <Text style={styles.greeting}>Buenos días!</Text>
                        <Text style={styles.userName}>{userName || "Productor"}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleQR}>
                        <Ionicons name="qr-code-outline" size={22} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
                        <Ionicons name="notifications-outline" size={22} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* CONTENIDO */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* CALIDAD DE LECHE — placeholder */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Calidad de leche</Text>
                    <Text style={styles.placeholderText}>Aquí se mostrará la calidad de la leche</Text>
                </View>

                {/* GRÁFICO DE BARRAS — placeholder */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Calidad de leche por mes</Text>
                    <Text style={styles.placeholderText}>Gráfico de barras próximamente</Text>
                </View>

                {/* FINCAS + CARACTERÍSTICAS — placeholder */}
                <View style={styles.bottomSection}>
                    <View style={styles.farmList}>
                        <View style={styles.farmItem}>
                            <View style={styles.farmAvatar}>
                                <Ionicons name="leaf-outline" size={18} color="#555" />
                            </View>
                            <Text style={styles.farmName}>Fincas</Text>
                        </View>
                    </View>
                    <View style={styles.statsCard}>
                        <Text style={styles.cardTitle}>Características</Text>
                        <Text style={styles.placeholderText}>Selecciona una finca para ver sus características</Text>
                    </View>
                </View>

                {/* CALENDARIO */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📅 Calendario de actividades</Text>
                    <Calendar
                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: "transparent",
                            calendarBackground: "transparent",
                            textSectionTitleColor: "#555",
                            selectedDayBackgroundColor: "#6eaaff",
                            selectedDayTextColor: "#fff",
                            todayTextColor: "#6eaaff",
                            dayTextColor: "#333",
                            dotColor: "#6eaaff",
                            arrowColor: "#6eaaff",
                            monthTextColor: "#222",
                            textDayFontWeight: "500",
                            textMonthFontWeight: "bold",
                        }}
                    />

                    {/* Eventos del día seleccionado */}
                    {selectedDate !== "" && (
                        <View style={styles.dayEventsContainer}>
                            <View style={styles.dayEventsHeader}>
                                <Text style={styles.dayEventsTitle}>
                                    {selectedDate}
                                </Text>
                                <TouchableOpacity
                                    style={styles.addEventBtn}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={styles.addEventBtnText}>Agregar</Text>
                                </TouchableOpacity>
                            </View>

                            {eventsOfDay.length === 0 ? (
                                <Text style={styles.noEventsText}>
                                    No hay actividades para este día
                                </Text>
                            ) : (
                                eventsOfDay.map((ev) => (
                                    <View key={ev.id} style={styles.eventItem}>
                                        <View style={styles.eventInfo}>
                                            <Text style={styles.eventType}>{ev.type}</Text>
                                            {ev.note !== "" && (
                                                <Text style={styles.eventNote}>{ev.note}</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteEvent(ev.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* BOTTOM TAB BAR */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("home")}>
                    <Ionicons
                        name={activeTab === "home" ? "home" : "home-outline"}
                        size={24}
                        color={activeTab === "home" ? "#000" : "#888"}
                    />
                    <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>
                        Home
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabCenter} onPress={handleChat}>
                    <Image
                        source={require("../../../../packages/assets/images/CallCow.png")}
                        style={styles.tabCowImage}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("user")}>
                    <Ionicons
                        name={activeTab === "user" ? "person" : "person-outline"}
                        size={24}
                        color={activeTab === "user" ? "#000" : "#888"}
                    />
                    <Text style={[styles.tabLabel, activeTab === "user" && styles.tabLabelActive]}>
                        User
                    </Text>
                </TouchableOpacity>
            </View>

            {/* MODAL AGREGAR EVENTO */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva actividad</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Selecciona el tipo:</Text>

                        <FlatList
                            data={EVENT_OPTIONS}
                            keyExtractor={(item) => item.value}
                            numColumns={2}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionChip,
                                        selectedType === item.value && styles.optionChipSelected,
                                    ]}
                                    onPress={() => setSelectedType(item.value)}
                                >
                                    <Text style={[
                                        styles.optionChipText,
                                        selectedType === item.value && styles.optionChipTextSelected,
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        <Text style={styles.modalSubtitle}>Nota (opcional):</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Ej: Ordeño de la mañana, finca norte..."
                            placeholderTextColor="#aaa"
                            value={note}
                            onChangeText={setNote}
                            multiline
                        />

                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                !selectedType && { opacity: 0.5 },
                            ]}
                            onPress={handleAddEvent}
                            disabled={!selectedType}
                        >
                            <Text style={styles.saveBtnText}>GUARDAR ACTIVIDAD</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
        </SafeAreaView>
    );
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
    greeting: { fontSize: 16, fontWeight: "bold", color: "#222" },
    userName: { fontSize: 12, color: "#666" },
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
    card: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 16,
    },
    cardTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 10 },
    placeholderText: { fontSize: 13, color: "#aaa", textAlign: "center", paddingVertical: 20 },
    bottomSection: { flexDirection: "row", gap: 12 },
    farmList: { gap: 10, width: 100 },
    farmItem: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 16,
        padding: 10,
        alignItems: "center",
        gap: 6,
    },
    farmItemSelected: {
        backgroundColor: "rgba(200,220,255,0.9)",
        borderWidth: 1,
        borderColor: "#aac4ff",
    },
    farmAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    farmName: { fontSize: 11, textAlign: "center", color: "#444" },
    statsCard: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    statRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    statName: { fontSize: 14, color: "#333", fontWeight: "500" },
    pieWrapper: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
    pieLabel: { fontSize: 10, fontWeight: "bold", color: "#333" },
    // Calendario
    dayEventsContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 12,
        gap: 10,
    },
    dayEventsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dayEventsTitle: { fontSize: 13, fontWeight: "bold", color: "#333" },
    addEventBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#6eaaff",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    addEventBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
    noEventsText: { fontSize: 13, color: "#aaa", textAlign: "center", paddingVertical: 8 },
    eventItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 10,
    },
    eventInfo: { flex: 1, gap: 2 },
    eventType: { fontSize: 13, fontWeight: "bold", color: "#333" },
    eventNote: { fontSize: 12, color: "#777" },
    // Bottom bar
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        gap: 12,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
    modalSubtitle: { fontSize: 13, fontWeight: "600", color: "#555", marginTop: 4 },
    optionChip: {
        flex: 1,
        margin: 4,
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        alignItems: "center",
    },
    optionChipSelected: {
        backgroundColor: "#6eaaff",
    },
    optionChipText: { fontSize: 12, color: "#444", textAlign: "center" },
    optionChipTextSelected: { color: "#fff", fontWeight: "bold" },
    noteInput: {
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: "#222",
        minHeight: 70,
        textAlignVertical: "top",
    },
    saveBtn: {
        backgroundColor: "#6eaaff",
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 4,
    },
    saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
