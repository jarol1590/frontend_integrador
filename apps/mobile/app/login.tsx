import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Pressable } from "react-native";

import { Ionicons } from "@expo/vector-icons";


export default function Login() {
  const handleLogin = () => {
    router.push("/dashboard" as any);
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
        source={require("../assets/images/MainBackground.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        imageStyle={{
          transform: [{ scale: 1.5 }],
        }}
      />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/WelcomeCow.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>BIENVENIDO!</Text>

        <View style={styles.card}>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#555"
              style={{ marginRight: 10 }}
            />
            <TextInput
              placeholder="Email"
              style={styles.input}
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#555" />
            <TextInput
              placeholder="Contraseña"
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#666"
            />
          </View>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgot}>
              Olvide mi contraseña
            </Text>
          </TouchableOpacity>

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              {
                transform: [
                  { scale: pressed ? 0.95 : 1 },
                  { translateY: pressed ? 2 : 0 }, // 👈 efecto “hundido”
                ],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.buttonText}>
              INGRESAR
            </Text>
          </Pressable>

          <View style={styles.registerContainer}>
            <Text style={styles.register}>
              Aun no tienes cuenta?{" "}
            </Text>

            <Pressable
              onPress={handleRegister}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text style={styles.registerLink}>
                Registrate
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

    </View>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 20,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 25
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  forgot: {
    alignSelf: "flex-start",
    marginBottom: 20,
    marginLeft: 5,
    color: "#555",
    textDecorationLine: "underline"
  },
  button: {
    backgroundColor: "#ccc",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,


    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  register: {
    textAlign: "center",
    color: "#555",
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

  registerLink: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#000",
    marginTop: 5,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  }


});