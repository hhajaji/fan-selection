export interface PerformanceData {
  airflow: number;
  staticPressure: number;
  power: number;
  efficiency?: number;
}

export interface Fan {
  id: number;
  model: string;
  type: string;
  manufacturer: string;
  imageUrl: string;
  description: string;
  maxAirflow: number; // m³/h
  maxStaticPressure: number; // Pa
  powerConsumption: number; // kW
  motorRpm: number;
  noiseLevel: number; // dB
  minTemp: number; // °C
  maxTemp: number; // °C
  fluidType: string[];
  price: number;
  electricalSpecs: {
      voltage: number;
      phase: number;
      frequency: number;
  };
  dimensions: {
    height: number; // mm
    width: number; // mm
    depth: number; // mm
  };
  performanceCurve: PerformanceData[];
}
