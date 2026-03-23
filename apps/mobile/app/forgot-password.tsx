import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ImageBackground,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from "react-native";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Method = null | "email" | "sms";

export default function ForgotPassword() {
    const [method, setMethod] = useState<Method>(null);
    const [value, setValue] = useState("");

    const handleSend = () => {
        if (!value.trim()) {
            Alert.alert("Error", method === "email"
                ? "Por favor ingresa un correo válido."
                : "Por favor ingresa un número de teléfono válido."
            );
            return;
        }
        console.log(`Enviar código via ${method} a:`, value);
        
    };

    const handleSelectMethod = (selected: Method) => {
        setMethod(selected);
        setValue("");
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [
                        { scale: 1.5 },
                        { translateY: 285 },
                    ],
                }}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => method ? handleSelectMethod(null) : router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../assets/images/ForgotP.png")}
                        style={styles.logo}
                    />
                </View>

                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.subtitle}>
                    {method === null
                        ? "Selecciona cómo quieres recuperar tu contraseña"
                        : method === "email"
                            ? "Ingresa tu correo y te enviaremos un código de verificación"
                            : "Ingresa tu número y te enviaremos un mensaje de texto con el código"}
                </Text>

                <View style={styles.card}>
                  
                    {method === null && (
                        <>
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => handleSelectMethod("email")}
                            >
                                <View style={styles.optionIcon}>
                                    <Ionicons name="mail-outline" size={22} color="#555" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>Recuperar via Email</Text>
                                    <Text style={styles.optionDesc}>
                                        Se enviará un correo electrónico con el código para reestablecer la contraseña
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => handleSelectMethod("sms")}
                            >
                                <View style={styles.optionIcon}>
                                    <Ionicons name="chatbubble-outline" size={22} color="#555" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>Recuperar via mensaje de texto</Text>
                                    <Text style={styles.optionDesc}>
                                        Se enviará un mensaje de texto con el código para reestablecer la contraseña
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                   
                    {method !== null && (
                        <>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name={method === "email" ? "mail-outline" : "phone-portrait-outline"}
                                    size={20}
                                    color="#555"
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    placeholder={method === "email" ? "Correo electrónico" : "Teléfono"}
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    keyboardType={method === "email" ? "email-address" : "phone-pad"}
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={setValue}
                                />
                            </View>

                            <Pressable
                                onPress={handleSend}
                                style={({ pressed }) => [
                                    styles.button,
                                    {
                                        transform: [
                                            { scale: pressed ? 0.95 : 1 },
                                            { translateY: pressed ? 2 : 0 },
                                        ],
                                        opacity: pressed ? 0.9 : 1,
                                    },
                                ]}
                            >
                                <Text style={styles.buttonText}>
                                    {method === "email" ? "ENVIAR EMAIL" : "ENVIAR SMS"}
                                </Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 20,
        padding: 8,
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    logoContainer: {
        width: 200,
        height: 200,
        marginBottom: 80,
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginBottom: 25,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    card: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 20,
        padding: 25,
    },
    
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 3,
        color: "#222",
    },
    optionDesc: {
        fontSize: 12,
        color: "#666",
        lineHeight: 17,
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 10,
    },
    
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ddd",
        borderRadius: 20,
        paddingHorizontal: 15,
        minHeight: 60,
        paddingVertical: 5,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#ccc",
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    buttonText: {
        fontWeight: "bold",
        fontSize: 16,
    },
});