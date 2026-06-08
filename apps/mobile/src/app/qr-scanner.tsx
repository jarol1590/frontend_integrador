// app/qr-scanner.tsx
import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";



const screenHeight = Dimensions.get("window").height;



export default function QRScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showSheet, setShowSheet] = useState(false);
    const [closing, setClosing] = useState(false);
    const translateY = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (showSheet) {
            setClosing(false);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [showSheet, translateY]);

    const handleClose = () => {
        setClosing(true);
        Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowSheet(false);
            setScanned(false);
            setQrData(null);
            setClosing(false);
            translateY.setValue(screenHeight);
        });
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

    const loteId = qrData?.lote_id ?? qrData?.lote ?? qrData?.id ?? qrData?.raw;
    const producto = qrData?.producto ?? qrData?.tipo_leche;
    const fincaOrigen = qrData?.finca_origen ?? qrData?.origen ?? qrData?.finca;

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

            {(showSheet || closing) && (
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

                    <Image
                        source={require("../../../../packages/assets/images/VasitoDancing.gif")}
                        style={styles.video}
                        resizeMode="contain"
                    />

                    <Text style={styles.sheetTitle}>Lote de leche</Text>

                    {qrData && (
                        <View style={styles.qrInfo}>
                            <Text style={styles.qrLabel}>
                                ID del lote:{" "}
                                <Text style={styles.qrValue}>
                                    {loteId}
                                </Text>
                            </Text>
                            {producto && (
                                <Text style={styles.qrLabel}>
                                    Producto:{" "}
                                    <Text style={styles.qrValue}>
                                        {producto}
                                    </Text>
                                </Text>
                            )}
                            {fincaOrigen && (
                                <Text style={styles.qrLabel}>
                                    Finca de origen:{" "}
                                    <Text style={styles.qrValue}>
                                        {fincaOrigen}
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

    video: {
        width: 170,
        height: 170,
        marginBottom: 10,
        borderRadius: 16,
    },
});