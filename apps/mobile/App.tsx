import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createFleetClient,
  type Vehicle,
  type SimulationResponse,
} from "@fleet/api-client";

// Resolve backend URL: EXPO_PUBLIC_API_URL -> Metro bundle host IP -> Emulator fallback -> localhost
function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^/:]+)/);
    const host = match ? match[1] : null;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://localhost:8000";
}

const API_URL = getApiUrl();
const client = createFleetClient({ baseUrl: API_URL });

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getVehicles();
      setVehicles(data);
      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (err: any) {
      setError(
        `${err?.message || "Failed to load vehicles. Ensure backend is running."} (API: ${API_URL})`
      );
    } finally {
      setLoading(false);
    }
  }

  async function runSampleSimulation(vehicle: Vehicle) {
    setLoading(true);
    setError(null);
    try {
      const result = await client.runSimulation({
        vehicle_id: vehicle.id,
        route_distance_km: 120,
        elevation_gain_m: 350,
        ambient_temp_c: 18,
        payload_kg: 200,
        hvac_mode: "LOW",
        driving_style: "NORMAL",
        regen_level: "MEDIUM",
        reserve_soc_target_pct: 15,
      });
      setSimResult(result);
    } catch (err: any) {
      setError(`${err?.message || "Simulation failed."} (API: ${API_URL})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>EV Fleet Telematics</Text>
        <Text style={styles.subtitle}>Mobile Decision Support</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVehicles}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionHeader}>Fleet Vehicles</Text>
      {loading && vehicles.length === 0 ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleList}
          renderItem={({ item }) => {
            const isSelected = selectedVehicle?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => {
                  setSelectedVehicle(item);
                  setSimResult(null);
                }}
              >
                <Text style={styles.vehicleName}>{item.name}</Text>
                <Text style={styles.vehicleModel}>{item.model}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>SOC: {item.current_soc}%</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selectedVehicle && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{selectedVehicle.name} Details</Text>
          <Text style={styles.detailRow}>Battery: {selectedVehicle.battery_capacity_kwh} kWh</Text>
          <Text style={styles.detailRow}>State of Health: {selectedVehicle.current_soh}%</Text>
          <Text style={styles.detailRow}>Efficiency: {selectedVehicle.baseline_efficiency_wh_km} Wh/km</Text>
          <Text style={styles.detailRow}>Status: {selectedVehicle.status}</Text>

          <TouchableOpacity
            style={styles.simulateButton}
            onPress={() => runSampleSimulation(selectedVehicle)}
            disabled={loading}
          >
            <Text style={styles.simulateButtonText}>
              {loading ? "Simulating..." : "Test 120km Route Simulation"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {simResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Simulation Feasibility</Text>
          <View
            style={[
              styles.riskBadge,
              simResult.risk_level === "SAFE"
                ? styles.riskSafe
                : simResult.risk_level === "CAUTION"
                ? styles.riskCaution
                : styles.riskDanger,
            ]}
          >
            <Text style={styles.riskText}>{simResult.risk_level}</Text>
          </View>
          <Text style={styles.detailRow}>Projected Arrival SOC: {simResult.projected_arrival_soc_pct.toFixed(1)}%</Text>
          <Text style={styles.detailRow}>Estimated Consumption: {simResult.estimated_energy_consumption_kwh.toFixed(1)} kWh</Text>
          <Text style={styles.detailRow}>Remaining Range: {simResult.remaining_range_km.toFixed(1)} km</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 10,
  },
  vehicleList: {
    maxHeight: 120,
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    minWidth: 140,
  },
  vehicleCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  vehicleModel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#0284c7",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0f172a",
  },
  detailRow: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  simulateButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  simulateButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  riskBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  riskSafe: {
    backgroundColor: "#dcfce7",
  },
  riskCaution: {
    backgroundColor: "#fef9c3",
  },
  riskDanger: {
    backgroundColor: "#fee2e2",
  },
  riskText: {
    fontWeight: "700",
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    marginBottom: 6,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#b91c1c",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
