import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#FFF" }]}
      edges={["top", "left", "right"]}
    >
      {/* Gradient Background */}
      {!isDark && (
        <LinearGradient
          colors={["#FFE8EE", "#FFFFFF", "#F9F5FF"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#F47B9F" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={[styles.title, { color: isDark ? "#FFF" : "#000" }]}>
        Create Account
      </Text>

      {/* Card */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#1E1E1E" : "#FFF" }]}
      >
        <View style={styles.form}>
          <TextInput
            placeholder="Full name"
            placeholderTextColor={isDark ? "#888" : "#B6B6B6"}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2A2A2A" : "#F8F8F8",
                color: isDark ? "#FFF" : "#000",
              },
            ]}
          />
          <TextInput
            placeholder="Email address"
            placeholderTextColor={isDark ? "#888" : "#B6B6B6"}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2A2A2A" : "#F8F8F8",
                color: isDark ? "#FFF" : "#000",
              },
            ]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={isDark ? "#888" : "#B6B6B6"}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2A2A2A" : "#F8F8F8",
                color: isDark ? "#FFF" : "#000",
              },
            ]}
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={isDark ? "#888" : "#B6B6B6"}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2A2A2A" : "#F8F8F8",
                color: isDark ? "#FFF" : "#000",
              },
            ]}
          />

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signUpButton}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: isDark ? "#2A2A2A" : "#FFF" },
            ]}
          >
            <Image
              source={require("@/assets/images/logo_google_g_icon.png")}
              style={styles.googleIcon}
            />
            <Text
              style={[
                styles.googleText,
                { color: isDark ? "#FFF" : "#4A4A4A" },
              ]}
            >
              Continue With Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: isDark ? "#AAA" : "#9A9A9A" }]}
          >
            Already have an account?{" "}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/screens/auth/LoginScreen")}
          >
            <Text style={styles.loginTextLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 25,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFAA",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 100,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
    alignItems: "center",
    marginTop: 30,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 15,
  },
  signUpButton: {
    backgroundColor: "#F47B9F",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  signUpButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EAEAEA" },
  dividerText: { marginHorizontal: 10, color: "#B6B6B6", fontSize: 13 },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
  },
  googleIcon: { width: 28, height: 20, marginRight: 8 },
  googleText: { fontSize: 15, fontWeight: "500" },
  footer: {
    flexDirection: "row",
    marginTop: 25,
  },
  footerText: { fontSize: 14 },
  loginTextLink: { color: "#F47B9F", fontSize: 14, fontWeight: "600" },
});
