import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ImageBackground,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BarChart, PieChart } from "react-native-gifted-charts";

// ─── Helpers ───────────────────────────────────────────────
const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const userNames = ["Juan García", "María López", "Carlos Pérez", "Ana Martínez"];
const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const generateMocks = () => {
    const currentMonth = new Date().getMonth();
    const quality = randomInt(20, 100);
    return {
        user: {
            name: userNames[randomInt(0, userNames.length - 1)],
        },
        barData: months.slice(0, currentMonth + 1).map((label) => ({
            label,
            value: randomInt(40, 100),
            frontColor: "#6eaaff",
        })),
        farms: [
            { id: "1", name: "Finca El Rosal" },
            { id: "2", name: "Finca La Esperanza" },
            { id: "3", name: "Finca Los Pinos" },
        ],
        milkStats: {
            quality,
            caracteristicas: [
                { name: "Vinagre", value: randomInt(20, 100) },
                { name: "Antibióticos", value: randomInt(20, 100) },
                { name: "Agua", value: randomInt(20, 100) },
            ],
        },
    };
};

// ─── Helpers de vaca ───────────────────────────────────────
const getCowImage = (quality: number) => {
    if (quality >= 75) return require("../assets/images/CowHappy.png");
    if (quality >= 40) return require("../assets/images/CowNormal.png");
    return require("../assets/images/CowSad.png");
};

const getCowColor = (quality: number) => {
    if (quality >= 75) return "#90ee90";
    if (quality >= 40) return "#ffd700";
    return "#ff6b6b";
};

// ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const [mocks, setMocks] = useState(generateMocks);
    const [selectedFarm, setSelectedFarm] = useState("1");
    const [activeTab, setActiveTab] = useState<"home" | "chat" | "user">("home");

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [currentCow, setCurrentCow] = useState(() =>
        getCowImage(mocks.milkStats.quality)
    );
    const [cowBorderColor, setCowBorderColor] = useState(() =>
        getCowColor(mocks.milkStats.quality)
    );

    // Animación de vaca
    const animateCow = (quality: number) => {
        setCowBorderColor(getCowColor(quality));
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start(() => {
            setCurrentCow(getCowImage(quality));
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        });
    };

    // Cada vez que cambian los mocks, animar la vaca
    useEffect(() => {
        animateCow(mocks.milkStats.quality);
    }, [mocks]);

    // Regenerar todos los datos
    const refreshData = () => {
        setMocks(generateMocks());
        setSelectedFarm("1");
    };

    const handleQR = () => router.push("/qr-scanner" as any);
    const handleNotifications = () => console.log("Notificaciones");
    const handleChat = () => console.log("Chat");

    return (
        <SafeAreaView style={styles.safeArea}>
            <ImageBackground
                source={require("../assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [{ scale: 1.5 }, { translateY: 285 }],
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
                        <Text style={styles.userName}>{mocks.user.name}</Text>
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

            {/* CONTENIDO PRINCIPAL */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* VACA */}
                <View style={[styles.card, {
                    alignItems: "center",
                    shadowColor: cowBorderColor,
                    shadowOpacity: 0.8,
                    shadowRadius: 12,
                    elevation: 8,
                    borderWidth: 1.5,
                    borderColor: cowBorderColor,
                }]}>
                    <Animated.Image
                        source={currentCow}
                        style={[styles.cowImage, { opacity: fadeAnim }]}
                    />
                    {/* Indicador de calidad */}
                    <View style={[styles.qualityBadge, { backgroundColor: cowBorderColor }]}>
                        <Text style={styles.qualityText}>
                            Calidad: {mocks.milkStats.quality}%
                        </Text>
                    </View>

                    {/* Botón refrescar - para la expo */}
                    <TouchableOpacity style={styles.refreshBtn} onPress={refreshData}>
                        <Ionicons name="refresh-outline" size={18} color="#555" />
                        <Text style={styles.refreshText}>Actualizar datos</Text>
                    </TouchableOpacity>
                </View>

                {/* GRÁFICO DE BARRAS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Calidad de leche por mes</Text>
                    <BarChart
                        data={mocks.barData}
                        barWidth={28}
                        spacing={12}
                        roundedTop
                        xAxisThickness={1}
                        yAxisThickness={0}
                        yAxisTextStyle={{ color: "#999", fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: "#999", fontSize: 9 }}
                        noOfSections={4}
                        maxValue={100}
                        height={120}
                        barBorderRadius={4}
                        isAnimated
                    />
                </View>

                {/* FINCAS + GRÁFICOS CIRCULARES */}
                <View style={styles.bottomSection}>
                    <View style={styles.farmList}>
                        {mocks.farms.map((farm) => (
                            <TouchableOpacity
                                key={farm.id}
                                style={[
                                    styles.farmItem,
                                    selectedFarm === farm.id && styles.farmItemSelected,
                                ]}
                                onPress={() => setSelectedFarm(farm.id)}
                            >
                                <View style={styles.farmAvatar}>
                                    <Ionicons name="leaf-outline" size={18} color="#555" />
                                </View>
                                <Text style={styles.farmName} numberOfLines={2}>
                                    {farm.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.statsCard}>
                        <Text style={styles.cardTitle}>Características</Text>
                        {mocks.milkStats.caracteristicas.map((stat) => (
                            <View key={stat.name} style={styles.statRow}>
                                <View style={styles.pieWrapper}>
                                    <PieChart
                                        data={[
                                            { value: stat.value, color: "#6eaaff" },
                                            { value: 100 - stat.value, color: "#e8e8e8" },
                                        ]}
                                        donut
                                        radius={28}
                                        innerRadius={18}
                                        innerCircleColor="#fff"
                                        centerLabelComponent={() => (
                                            <Text style={styles.pieLabel}>{stat.value}%</Text>
                                        )}
                                    />
                                </View>
                                <Text style={styles.statName}>{stat.name}</Text>
                            </View>
                        ))}
                    </View>
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
                        source={require("../assets/images/CallCow.png")}
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
        backgroundColor: "rgba(255,255,255,0.85)",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
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
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 20,
        padding: 16,
    },
    cardTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 10 },
    cowImage: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        alignSelf: "center",
    },
    qualityBadge: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    qualityText: {
        fontWeight: "bold",
        fontSize: 13,
        color: "#333",
    },
    refreshBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#eee",
        borderRadius: 12,
    },
    refreshText: { fontSize: 13, color: "#555" },
    bottomSection: { flexDirection: "row", gap: 12 },
    farmList: { gap: 10, width: 100 },
    farmItem: {
        backgroundColor: "rgba(255,255,255,0.85)",
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
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    statRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    statName: { fontSize: 14, color: "#333", fontWeight: "500" },
    pieWrapper: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
    pieLabel: { fontSize: 10, fontWeight: "bold", color: "#333" },
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
});