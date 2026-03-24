// components/CodeResultModal.tsx
import {
    Modal,
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
} from "react-native";

type Props = {
    visible: boolean;
    success: boolean;
    onSuccess: () => void;   
    onRetry: () => void;     
};

export default function CodeResultModal({ visible, success, onSuccess, onRetry }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            
            <View style={styles.overlay}>
                <View style={styles.card}>

                    
                    <View style={styles.imageContainer}>
                        {success ? (
                            <Image
                                source={require("../assets/images/OkCow.png")}
                                style={styles.image}
                            />
                        ) : (
                            <Image
                                source={require("../assets/images/BadCow.png")}
                                style={styles.image}
                            />
                        )}
                    </View>

                    
                    <Text style={styles.message}>
                        {success
                            ? "El código ingresado es correcto"
                            : "El código ingresado es incorrecto"}
                    </Text>

                   
                    <Pressable
                        onPress={success ? onSuccess : onRetry}
                        style={({ pressed }) => [
                            styles.button,
                            { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                        ]}
                    >
                        <Text style={styles.buttonText}>
                            {success ? "OK!" : "Enviar otro código"}
                        </Text>
                    </Pressable>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    card: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 24,
        padding: 30,
        alignItems: "center",
    },
    imageContainer: {
        width: 150,   
        height: 150,  
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    message: {
        fontSize: 16,
        textAlign: "center",
        color: "#222",
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: "#ccc",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    buttonText: {
        fontWeight: "bold",
        fontSize: 15,
    },
});