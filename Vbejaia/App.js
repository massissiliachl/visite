import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function App() {
  const [step, setStep] = useState(0);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <View style={styles.container}>

      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.title}>👋 Welcome to Visitbejaia</Text>
          <Text style={styles.text}>
            Discover boats, trips and beautiful places in Béjaïa.
          </Text>
          <TouchableOpacity style={styles.button} onPress={nextStep}>
            <Text style={styles.btnText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.title}>🚤 Step 1</Text>
          <Text style={styles.text}>
            Choose your destination and explore boat trips.
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={prevStep}>
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={nextStep}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.title}>📍 Step 2</Text>
          <Text style={styles.text}>
            Find the best locations and book your experience.
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={prevStep}>
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => setStep(0)}>
              <Text style={styles.btnText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#1e293b",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#38bdf8",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginHorizontal: 5,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
  },
});