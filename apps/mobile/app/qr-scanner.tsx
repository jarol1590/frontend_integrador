// app/qr-scanner.tsx
import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Dimensions } from "react-native";

export default function QRScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showSheet, setShowSheet] = useState(false);
    const screenHeight = Dimensions.get("window").height;
    const translateY = useState(new Animated.Value(screenHeight))[0];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -5,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;

        setScanned(true);

        try {
            const parsed = JSON.parse(data); // si usas JSON
            setQrData(parsed);
        } catch {
            setQrData({ raw: data }); // fallback
        }

        setShowSheet(true);
    };

    // Sin permisos aún
    if (!permission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permissionText}>
                    Solicitando permiso de cámara...
                </Text>
            </View>
        );
    }

    // Permiso denegado
    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Ionicons name="camera-outline" size={60} color="#555" />
                <Text style={styles.permissionText}>
                    Se necesita acceso a la cámara para escanear QR
                </Text>
                <TouchableOpacity
                    style={styles.permissionBtn}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionBtnText}>Dar permiso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Botón volver */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Cámara */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.topOverlay} />

                <View style={styles.middleRow}>
                    <View style={styles.sideOverlay} />

                    {/* Marco del QR */}
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>

                    <View style={styles.sideOverlay} />
                </View>

                <View style={styles.bottomOverlay}>
                    <Text style={styles.scanText}>
                        {scanned
                            ? "✓ QR detectado"
                            : "Apunta al código QR"}
                    </Text>
                    {scanned && (
                        <TouchableOpacity
                            style={styles.rescanBtn}
                            onPress={() => setScanned(false)}
                        >
                            <Text style={styles.rescanBtnText}>
                                Escanear otro
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {showSheet && (
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        { transform: [{ translateY }] },
                    ]}
                >
                    {/* 🥛 Animación simple */}
                    <Animated.View style={styles.milkBottle} />

                    <Text style={styles.sheetTitle}>Lote de leche</Text>

                    {qrData && (
                        <View style={{ gap: 6 }}>
                            <Text>ID: {qrData.lote_id}</Text>
                            <Text>Producto: {qrData.producto}</Text>
                            <Text>Producción: {qrData.fecha_produccion}</Text>
                            <Text>Vence: {qrData.fecha_vencimiento}</Text>
                            <Text>Origen: {qrData.origen}</Text>
                            <Text>Estado: {qrData.estado_calidad}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => {
                            setShowSheet(false);
                            setScanned(false);
                            translateY.setValue(screenHeight);
                        }}
                    >
                        <Text style={{ color: "#fff" }}>Cerrar</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const FRAME_SIZE = 250;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
        gap: 20,
        backgroundColor: "#fff",
    },
    permissionText: {
        textAlign: "center",
        fontSize: 16,
        color: "#444",
        lineHeight: 24,
    },
    permissionBtn: {
        backgroundColor: "#6eaaff",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 20,
    },
    permissionBtnText: {
        fontWeight: "bold",
        color: "#fff",
        fontSize: 16,
    },
    backBtn: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    backBtnText: {
        color: "#555",
        fontSize: 15,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        padding: 10,
    },
    // Overlay
    overlay: {
        flex: 1,
    },
    topOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    middleRow: {
        flexDirection: "row",
        height: FRAME_SIZE,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    scanFrame: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundColor: "transparent",
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    scanText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
    },
    rescanBtn: {
        backgroundColor: "#6eaaff",
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 20,
    },
    rescanBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
    // Esquinas del marco
    corner: {
        position: "absolute",
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: "#6eaaff",
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
    },

    bottomSheet: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: "45%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        elevation: 20,
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },

    closeBtn: {
        marginTop: 20,
        backgroundColor: "#6eaaff",
        padding: 12,
        borderRadius: 15,
        alignItems: "center",
    },

    // 🥛 Botella animada (simple)
    milkBottle: {
        width: 50,
        height: 80,
        backgroundColor: "#e6f2ff",
        alignSelf: "center",
        borderRadius: 20,
        marginBottom: 10,
    },
});