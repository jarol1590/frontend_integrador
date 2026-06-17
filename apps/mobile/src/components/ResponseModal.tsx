import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface ResponseModalProps {
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onClose: () => void;
}

export default function ResponseModal({ visible, type, title, message, onClose }: ResponseModalProps) {
    const image = type === "success"
        ? require("../../../../packages/assets/images/OkCow.png")
        : require("../../../../packages/assets/images/BadCow.png");

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Image source={image} style={styles.image} />
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Aceptar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        gap: 12,
        width: "80%",
        maxWidth: 340,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    image: { width: 120, height: 120, resizeMode: "contain" },
    title: { fontSize: 18, fontWeight: "bold", color: "#222", textAlign: "center" },
    message: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
    button: {
        backgroundColor: "#6eaaff",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 20,
        marginTop: 8,
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
