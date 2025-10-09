import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={["#FFE6EC", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft pink glow circle */}
      <View style={styles.circleBackground} />

      {/* Greeting Section */}
      <View style={styles.textContainer}>
        <View>
          <Text style={styles.title}>Welcome</Text>
          <View style={styles.logoRow}>
            <Text style={styles.toText}>to</Text>
            <Image
              source={require("@/assets/images/aleraLogo.png")}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>lera</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Explore the app, Find some peace of mind to prepare for meditation.
        </Text>
      </View>

      {/* Illustration */}
      <Image
        source={require("@/assets/images/Alera.png")}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push("/screens/auth/RegisterScreen")}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/screens/auth/LoginScreen")}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  // 🌸 Circle glow di belakang ilustrasi
  circleBackground: {
    position: "absolute",
    top: "35%",
    left: "50%",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#FDD6E0",
    opacity: 0.5,
    transform: [{ translateX: -200 }],
    zIndex: -1,
  },

  textContainer: {
    alignItems: "center",
    paddingHorizontal: 25,
    marginTop: 20,
    gap: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
  },
  toText: {
    fontSize: 30,
    color: "#000",
    marginRight: 6,
    fontWeight: "600",
  },
  logoText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#F47B9F",
  },
  logoIcon: {
    width: 36,
    height: 36,
    marginRight: -4,
    marginLeft: -4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
    paddingHorizontal: 24,
  },
  image: {
    width: 250,
    height: 250,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: "#F47B9F",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    width: "80%",
  },
  getStartedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    borderWidth: 2,
    borderColor: "#F47B9F",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    width: "80%",
  },
  loginButtonText: {
    color: "#F47B9F",
    fontSize: 16,
    fontWeight: "600",
  },
});
