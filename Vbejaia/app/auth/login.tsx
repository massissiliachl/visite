import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const API_URL = "https://visitebejai.onrender.com/api";

  // Fonction pour aller en mode découverte (sans connexion)
  const goToDiscovery = () => {
    router.push("/(tabs)/decouverte");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs pour continuer");
      return;
    }

    setLoading(true);

    const TEST_CREDENTIALS = {
      email: "test@test.com",
      password: "123456",
      user: {
        id: 1,
        name: "Test User",
        email: "test@test.com",
        role: "user",
      },
      token: "fake-jwt-token-123456",
    };

    try {
      if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
        await AsyncStorage.setItem("token", TEST_CREDENTIALS.token);
        await AsyncStorage.setItem("user", JSON.stringify(TEST_CREDENTIALS.user));

        Alert.alert("Bienvenue !", "Connexion réussie en mode découverte");
        
        setLoading(false);
        
        if (TEST_CREDENTIALS.user.role === "admin") {
          router.replace("/(tabs)/admin");
        } else {
          router.replace("/(tabs)/home");
        }
        return;
      }

      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const data = res.data;

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      Alert.alert("Succès", "Connexion réussie");
      setLoading(false);

      if (data.user.role === "admin") {
        router.replace("/(tabs)/admin");
      } else {
        router.replace("/(tabs)/home");
      }

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      setLoading(false);
      Alert.alert("Erreur", "Email ou mot de passe incorrect");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200" }}
            style={styles.backgroundImage}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.7)"]}
              style={styles.overlay}
            >
              <Animated.View 
                style={[
                  styles.contentContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                  }
                ]}
              >
                {/* Logo Section - Voyage Theme */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <MaterialCommunityIcons name="compass" size={50} color="#fff" />
                  </View>
                  <Text style={styles.appName}>Béjaïa Voyages</Text>
                  <Text style={styles.tagline}>Explorez la perle de la Kabylie</Text>
                  <View style={styles.locationBadge}>
                    <Ionicons name="location-outline" size={14} color="#FFD700" />
                    <Text style={styles.locationText}>Algérie - Béjaïa</Text>
                  </View>
                </View>

                {/* Form Section - Redesigned for Travel Agency */}
                <View style={styles.formContainer}>
                  <Text style={styles.welcomeText}>Bon retour parmi nous</Text>
                  <Text style={styles.subWelcomeText}>Connectez-vous pour réserver vos activités</Text>

                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Adresse email"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    {email !== "" && (
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.validationIcon} />
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Mot de passe"
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#FF6B35"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => Alert.alert("Mot de passe oublié", "Contactez notre équipe pour réinitialiser votre mot de passe")}
                  >
                    <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Explorer Béjaïa</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Mode Découverte - SANS CONNEXION */}
                  <TouchableOpacity
                    style={styles.discoveryButton}
                    onPress={goToDiscovery}
                  >
                    <LinearGradient
                      colors={['#FF6B35', '#2196F3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.discoveryGradient}
                    >
                      <MaterialCommunityIcons name="compass" size={22} color="#fff" />
                      <Text style={styles.discoveryButtonText}>Mode Découverte</Text>
                      <Ionicons name="eye-outline" size={18} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.discoveryNote}>
                    👁️ Explorez Béjaïa sans vous connecter
                  </Text>


                 
                  {/* Travel Features */}
                  <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                      <Ionicons name="boat-outline" size={20} color="#FF6B35" />
                      <Text style={styles.featureText}>Excursions</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="restaurant-outline" size={20} color="#FF6B35" />
                      <Text style={styles.featureText}>Gastronomie</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="bed-outline" size={20} color="#FF6B35" />
                      <Text style={styles.featureText}>Hébergement</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="camera-outline" size={20} color="#FF6B35" />
                      <Text style={styles.featureText}>Visites</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 107, 53, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#FFD700",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 14,
    color: "#FFD700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  locationText: {
    color: "#FFD700",
    fontSize: 12,
    marginLeft: 4,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
  },
  subWelcomeText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 15,
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    position: "relative",
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#2C3E50",
  },
  validationIcon: {
    paddingRight: 15,
  },
  eyeIcon: {
    paddingRight: 15,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#FF6B35",
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#7F8C8D",
    fontSize: 14,
  },
  // Nouveaux styles pour le bouton Mode Découverte
  discoveryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
  },
  discoveryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  discoveryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discoveryNote: {
    textAlign: 'center',
    color: '#7F8C8D',
    fontSize: 11,
    marginBottom: 15,
  },
  signupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FF6B35",
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  signupText: {
    color: "#FF6B35",
    fontSize: 16,
    marginRight: 8,
    fontWeight: "600",
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#F8F9FA",
    marginBottom: 20,
  },
  demoButtonText: {
    color: "#FF6B35",
    fontSize: 15,
    marginLeft: 8,
    fontWeight: "500",
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  featureItem: {
    alignItems: "center",
  },
  featureText: {
    fontSize: 11,
    color: "#7F8C8D",
    marginTop: 4,
  },
});