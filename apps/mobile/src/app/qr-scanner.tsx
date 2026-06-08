// app/qr-scanner.tsx
import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;

function MilkGlass() {
    const waveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(waveAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [waveAnim]);

    const waveX = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-15, 15],
    });

    const waveX2 = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, -10],
    });

    const waveY = waveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -4, 0],
    });

    return (
        <View style={milkStyles.container}>
            <View style={milkStyles.glass}>
                <View style={milkStyles.milkFill} />
                <Animated.View
                    style={[
                        milkStyles.wavePill,
                        {
                            transform: [
                                { translateX: waveX },
                                { translateY: waveY },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        milkStyles.wavePill2,
                        {
                            transform: [
                                { translateX: waveX2 },
                                { translateY: waveY },
                            ],
                        },
                    ]}
                />
            </View>
            <View style={milkStyles.stem} />
            <View style={milkStyles.base} />
        </View>
    );
}

const milkStyles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    glass: {
        width: 100,
        height: 140,
        borderWidth: 3,
        borderColor: "#b0c4de",
        borderRadius: 16,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    milkFill: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "78%",
        backgroundColor: "#fef9e0",
    },
    wavePill: {
        position: "absolute",
        bottom: "78%",
        left: -20,
        width: 80,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#fef9e0",
    },
    wavePill2: {
        position: "absolute",
        bottom: "77%",
        left: 30,
        width: 70,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#fef9e0",
    },
    stem: {
        width: 6,
        height: 25,
        backgroundColor: "#b0c4de",
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },
    base: {
        width: 60,
        height: 6,
        backgroundColor: "#b0c4de",
        borderRadius: 3,
        marginTop: -2,
    },
});

export default function QRScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showSheet, setShowSheet] = useState(false);
    const translateY = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (showSheet) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } else {
            translateY.setValue(screenHeight);
        }
    }, [showSheet, translateY]);

    const handleClose = () => {
        setShowSheet(false);
        setScanned(false);
        setQrData(null);
        translateY.setValue(screenHeight);
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;

        setScanned(true);

        try {
            const parsed = JSON.parse(data);
            setQrData(parsed);
        } catch {
            setQrData({ raw: data });
        }

        setShowSheet(true);
    };

    if (!permission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permissionText}>
                    Solicitando permiso de cámara...
                </Text>
            </View>
        );
    }

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

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            <View style={styles.overlay}>
                <View style={styles.topOverlay} />

                <View style={styles.middleRow}>
                    <View style={styles.sideOverlay} />

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
                    <TouchableOpacity
                        style={styles.closeX}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={26} color="#666" />
                    </TouchableOpacity>

                    <MilkGlass />

                    <Text style={styles.sheetTitle}>Lote de leche</Text>

                    {qrData && (
                        <View style={styles.qrInfo}>
                            <Text style={styles.qrLabel}>
                                ID:{" "}
                                <Text style={styles.qrValue}>
                                    {qrData.lote_id ?? qrData.raw}
                                </Text>
                            </Text>
                            {qrData.producto && (
                                <Text style={styles.qrLabel}>
                                    Producto:{" "}
                                    <Text style={styles.qrValue}>
                                        {qrData.producto}
                                    </Text>
                                </Text>
                            )}
                            {qrData.fecha_produccion && (
                                <Text style={styles.qrLabel}>
                                    Producción:{" "}
                                    <Text style={styles.qrValue}>
                                        {qrData.fecha_produccion}
                                    </Text>
                                </Text>
                            )}
                            {qrData.fecha_vencimiento && (
                                <Text style={styles.qrLabel}>
                                    Vence:{" "}
                                    <Text style={styles.qrValue}>
                                        {qrData.fecha_vencimiento}
                                    </Text>
                                </Text>
                            )}
                            {qrData.origen && (
                                <Text style={styles.qrLabel}>
                                    Origen:{" "}
                                    <Text style={styles.qrValue}>
                                        {qrData.origen}
                                    </Text>
                                </Text>
                            )}
                            {qrData.estado_calidad && (
                                <Text style={styles.qrLabel}>
                                    Estado:{" "}
                                    <Text style={styles.qrValue}>
                                        {qrData.estado_calidad}
                                    </Text>
                                </Text>
                            )}
                        </View>
                    )}
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
        height: "50%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 30,
        alignItems: "center",
        elevation: 20,
    },

    closeX: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#222",
    },

    qrInfo: {
        width: "100%",
        gap: 6,
        paddingHorizontal: 8,
    },

    qrLabel: {
        fontSize: 14,
        color: "#555",
    },

    qrValue: {
        fontSize: 14,
        color: "#222",
        fontWeight: "600",
    },
});