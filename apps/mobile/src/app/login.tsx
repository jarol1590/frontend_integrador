import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    ImageBackground,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@proyectointegrador/application";
import { useDependencies } from "../providers/DependencyProvider";

export default function Login() {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { loginUseCase } = useDependencies();

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        try {
            const response = await loginUseCase.execute(data);
            router.push("/dashboard" as any);
            Alert.alert("Bienvenido ", response.usuario.email);
        } catch (error: any) {
            Alert.alert("Error", error.message ?? "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        router.push("/forgot-password" as any);
    };

    const handleRegister = () => {
        router.push("/register" as any);
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [{ scale: 1.5 }],
                    opacity: 0.50
                }}
            />
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../../packages/assets/images/WelcomeCow.png")}
                        style={styles.logo}
                    />
                </View>

                <Text style={styles.title}>BIENVENIDO!</Text>

                <View style={styles.card}>

                    {/* PARTE SUPERIOR */}
                    <View>
                        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                            <Ionicons name="mail-outline" size={20} color="#555" style={{ marginRight: 10 }} />
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Email"
                                        style={styles.input}
                                        placeholderTextColor="#666"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                )}
                            />
                        </View>
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email.message}</Text>
                        )}

                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                            <Ionicons name="key-outline" size={20} color="#555" />
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Contraseña"
                                        secureTextEntry={!showPassword}
                                        style={styles.input}
                                        placeholderTextColor="#666"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                    />
                                )}
                            />
                            <Pressable onPress={() => setShowPassword((s) => !s)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={22}
                                    color="#555"
                                />
                            </Pressable>
                        </View>
                        {errors.password && (
                            <Text style={styles.errorText}>{errors.password.message}</Text>
                        )}

                        <TouchableOpacity onPress={handleForgotPassword}>
                            <Text style={styles.forgot}>Olvide mi contraseña</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PARTE INFERIOR */}
                    <View>
                        <Pressable
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    transform: [
                                        { scale: pressed ? 0.95 : 1 },
                                        { translateY: pressed ? 2 : 0 },
                                    ],
                                    opacity: pressed || loading ? 0.7 : 1,
                                },
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#333" />
                            ) : (
                                <Text style={styles.buttonText}>INGRESAR</Text>
                            )}
                        </Pressable>

                        <View style={styles.registerContainer}>
                            <Text style={styles.register}>Aun no tienes cuenta? </Text>
                            <Pressable
                                onPress={handleRegister}
                                style={({ pressed }) => ({
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                    opacity: pressed ? 0.5 : 1,
                                })}
                            >
                                <Text style={styles.registerLink}>Registrate</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, width: "100%", height: "100%" },
    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
    logoContainer: {
        width: 170,
        height: 170,
        borderRadius: 100,
        overflow: "hidden",
        marginBottom: 20,
        borderWidth: 2.2,
        borderColor: "#000000",
        shadowColor: "#000000",
        shadowOpacity: 0.9,
        shadowRadius: 50,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },
    logo: { width: "100%", height: "100%" },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
    card: {
        width: "98%",
        height: "58%",
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        borderRadius: 30,
        padding: 24,
        paddingTop: 70,
        paddingBottom: 45,
        borderWidth: 0.8,
        borderColor: "#000000",
        justifyContent: "space-between",
    },
    input: { flex: 1, fontSize: 16 },
    inputError: { borderWidth: 1.5, borderColor: "#e74c3c" },
    errorText: {
        color: "#e74c3c",
        fontSize: 12,
        marginTop: -12,
        marginBottom: 8,
        marginLeft: 5,
    },
    forgot: {
        alignSelf: "flex-start",
        marginBottom: 20,
        marginLeft: 5,
        color: "#555",
        textDecorationLine: "underline",
    },
    button: {
        backgroundColor: "#ccc",
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    buttonText: { fontWeight: "bold", fontSize: 16 },
    register: { textAlign: "center", color: "#555" },
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
    registerLink: { textAlign: "center", fontWeight: "bold", color: "#000", marginTop: 5 },
    registerContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
});
