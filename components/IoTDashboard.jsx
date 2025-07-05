"use client";
import React, { useState, useEffect } from "react";
import {
  Thermometer,
  Droplets,
  Ruler,
  Eye,
  Power,
  Wifi,
  Activity,
  Settings,
  BarChart3,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react";

const IoTDashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    distance: 0,
    ir: 0,
    relay1: false,
    relay2: false,
    wifi_rssi: 0,
    timestamp: 0,
    device_id: "ESP32_001",
    free_heap: 0,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAZiGOK1a6NHNpqQ2kroFxho171o1Vh-MA",
    authDomain: "iot-1-e39d6.firebaseapp.com",
    databaseURL:
      "https://iot-1-e39d6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iot-1-e39d6",
    storageBucket: "iot-1-e39d6.firebasestorage.app",
    messagingSenderId: "148826924272",
    appId: "1:148826924272:web:e11fd217a0ac39aaef4e35",
    measurementId: "G-FXCLS6FJ5B",
  };

  // Fetch data from Firebase
  const fetchFirebaseData = async () => {
    try {
      const response = await fetch(
        `${firebaseConfig.databaseURL}/sensors.json`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        setSensorData((prevData) => ({
          ...prevData,
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          distance: data.distance || 0,
          ir: data.ir || 0,
          relay1: data.relay1 || false,
          relay2: data.relay2 || false,
          wifi_rssi: data.wifi_rssi || 0,
          timestamp: data.timestamp || Date.now(),
          device_id: data.device_id || "ESP32_001",
          free_heap: data.free_heap || 0,
        }));

        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching Firebase data:", err);
      setError(`Failed to fetch data: ${err.message}`);
      setIsConnected(false);
    }
  };

  // Update relay state in Firebase
  const updateRelay = async (relayNumber, state) => {
    try {
      const response = await fetch(
        `${firebaseConfig.databaseURL}/sensors/relay${relayNumber}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state immediately for better UX
      setSensorData((prev) => ({
        ...prev,
        [`relay${relayNumber}`]: state,
      }));

      console.log(`Relay ${relayNumber} updated to ${state ? "ON" : "OFF"}`);
    } catch (err) {
      console.error("Error updating relay:", err);
      setError(`Failed to update relay: ${err.message}`);
    }
  };

  // Set up real-time data fetching
  useEffect(() => {
    // Initial fetch
    fetchFirebaseData();

    // Set up interval for polling (since we're using REST API)
    const interval = setInterval(fetchFirebaseData, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleRelay = (relayNumber) => {
    const currentState = sensorData[`relay${relayNumber}`];
    updateRelay(relayNumber, !currentState);
  };

  const getSignalStrength = (rssi) => {
    if (rssi >= -30) return { strength: "Excellent", color: "text-green-400" };
    if (rssi >= -50) return { strength: "Good", color: "text-blue-400" };
    if (rssi >= -70) return { strength: "Fair", color: "text-yellow-400" };
    return { strength: "Poor", color: "text-red-400" };
  };

  const formatUptime = (timestamp) => {
    const seconds = Math.floor(timestamp / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const SensorCard = ({
    icon: Icon,
    title,
    value,
    unit,
    color = "text-white",
  }) => (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>
            <Icon size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          ></div>
          <span className="text-xs text-gray-500">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-sm text-gray-400">{unit}</span>
      </div>
    </div>
  );

  const RelayControl = ({ relayNumber, isOn, onToggle }) => (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isOn ? "bg-green-600" : "bg-gray-800"
            }`}
          >
            <Power
              size={20}
              className={isOn ? "text-white" : "text-gray-400"}
            />
          </div>
          <h3 className="text-sm font-medium text-gray-300">
            Relay {relayNumber}
          </h3>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOn ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {isOn ? "ON" : "OFF"}
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={!isConnected}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
          !isConnected
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : isOn
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {!isConnected ? "Offline" : `Turn ${isOn ? "OFF" : "ON"}`}
      </button>
    </div>
  );

  const signal = getSignalStrength(sensorData.wifi_rssi);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Activity size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">IoT Dashboard</h1>
                  <p className="text-xs text-gray-400">
                    ESP32 Smart Home Control
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wifi size={16} className={signal.color} />
                <span className="text-sm text-gray-300">{signal.strength}</span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isConnected ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-xs font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <span className="text-red-200 font-medium">Connection Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        <div className="mb-8 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-300">Last Update:</span>
                <span className="text-white font-medium">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-400" />
                <span className="text-gray-300">Uptime:</span>
                <span className="text-white font-medium">
                  {formatUptime(sensorData.timestamp)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Device:</span>
              <span className="text-white font-medium">
                {sensorData.device_id}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SensorCard
            icon={Thermometer}
            title="Temperature"
            value={
              typeof sensorData.temperature === "number"
                ? sensorData.temperature.toFixed(1)
                : sensorData.temperature
            }
            unit="°C"
            color="text-red-400"
          />
          <SensorCard
            icon={Droplets}
            title="Humidity"
            value={
              typeof sensorData.humidity === "number"
                ? sensorData.humidity.toFixed(1)
                : sensorData.humidity
            }
            unit="%"
            color="text-blue-400"
          />
          <SensorCard
            icon={Ruler}
            title="Distance"
            value={
              typeof sensorData.distance === "number"
                ? sensorData.distance.toFixed(0)
                : sensorData.distance
            }
            unit="cm"
            color="text-green-400"
          />
          <SensorCard
            icon={Eye}
            title="Motion Sensor"
            value={sensorData.ir ? "Detected" : "Clear"}
            unit=""
            color={sensorData.ir ? "text-red-400" : "text-green-400"}
          />
        </div>

        {/* Controls and System Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relay Controls */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Device Controls
            </h2>
            <div className="space-y-4">
              <RelayControl
                relayNumber={1}
                isOn={sensorData.relay1}
                onToggle={() => toggleRelay(1)}
              />
              <RelayControl
                relayNumber={2}
                isOn={sensorData.relay2}
                onToggle={() => toggleRelay(2)}
              />
            </div>
          </div>

          {/* System Information */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              System Information
            </h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Network Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Signal Strength</span>
                      <span className={`font-medium ${signal.color}`}>
                        {sensorData.wifi_rssi} dBm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connection</span>
                      <span
                        className={`font-medium ${
                          isConnected ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isConnected ? "Active" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Hardware Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Free Memory</span>
                      <span className="text-white font-medium">
                        {(sensorData.free_heap / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">System Status</span>
                      <span
                        className={`font-medium ${
                          isConnected ? "text-green-400" : "text-yellow-400"
                        }`}
                      >
                        {isConnected ? "Healthy" : "Monitoring"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Usage Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white">
                    {sensorData.free_heap > 0
                      ? (
                          ((300000 - sensorData.free_heap) / 300000) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        sensorData.free_heap > 0
                          ? ((300000 - sensorData.free_heap) / 300000) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchFirebaseData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Refresh Data
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium">
              Restart Device
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium">
              WiFi Reconnect
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium">
              Export Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IoTDashboard;
