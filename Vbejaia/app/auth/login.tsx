import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // 🔐 IDENTIFIANTS DE TEST
    const TEST_CREDENTIALS = {
      email: "test@test.com",
      password: "123456",
      user: {
        id: 1,
        name: "Test User",
        email: "test@test.com",
        role: "user" // ou "admin" pour tester le dashboard admin
      },
      token: "fake-jwt-token-123456"
    };
  
    // Vérification locale pour les tests
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      await AsyncStorage.setItem("token", TEST_CREDENTIALS.token);
      await AsyncStorage.setItem("user", JSON.stringify(TEST_CREDENTIALS.user));
      
      Alert.alert("Success", "Login successful (test mode)");
      
      if (TEST_CREDENTIALS.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/(tabs)");
      }
      return;
    }
  
    // Sinon, appel API normal
    try {
      const res = await axios.post("http://192.168.1.36/api/auth/login", {
        email,
        password,
      });
      // ... reste du code
    } catch (err) {
      Alert.alert("Erreur", "Email ou mot de passe incorrect. Test: test@test.com / 123456");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>V Béjaïa Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f6fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});