import { botEngine, systemBus } from '../kernel/systemBridge';

export type DeviceType = 'Climate' | 'Lighting' | 'Utility' | 'Transport' | 'Power' | 'Security';

export type IotDevice = {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Warning' | 'Critical' | 'Optimal';
  type: DeviceType;
  temp?: number;
  load?: number;
  energy?: number;
  brightness?: number;
  power?: number;
  flow?: number;
  pressure?: number;
  floor?: number;
  direction?: 'Up' | 'Down' | 'Idle';
  charge?: number;
  activeNodes?: number;
  health?: number;
};

export type TelemetryMetrics = {
  totalConsumption: number;
  gridStability: number;
  systemEfficiency: number;
  activeAlerts: number;
  carbonIntensity: number;
  latencyMs: number;
  uptimeMinutes: number;
};

export type IotAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  deviceId?: string;
  timestamp: number;
};

export type IotSnapshot = {
  devices: IotDevice[];
  metrics: TelemetryMetrics;
  alerts: IotAlert[];
  lastUpdated: number;
};

const seedDevices: IotDevice[] = [
  { id: 'hvac_01', name: 'Lobby HVAC Unit 1', status: 'Online', type: 'Climate', temp: 22.4, load: 65, energy: 4.2 },
  { id: 'hvac_02', name: 'Rooftop AHU-4', status: 'Warning', type: 'Climate', temp: 24.8, load: 88, energy: 6.8 },
  { id: 'lgt_lby', name: 'Lobby Lighting Grid', status: 'Online', type: 'Lighting', brightness: 75, power: 1.2 },
  { id: 'wtr_main', name: 'Main Water Inflow', status: 'Online', type: 'Utility', flow: 124, pressure: 55 },
  { id: 'elev_01', name: 'Guest Elevator A', status: 'Online', type: 'Transport', floor: 12, direction: 'Up' },
  { id: 'pwr_ups', name: 'Data Center UPS', status: 'Optimal', type: 'Power', charge: 100, load: 22 },
  { id: 'iot_cam_01', name: 'Perimeter Sensor Net', status: 'Online', type: 'Security', activeNodes: 42, health: 99 },
  { id: 'hvac_03', name: 'Conference Hall HVAC', status: 'Offline', type: 'Climate', temp: 0, load: 0, energy: 0 },
  { id: 'lgt_corr', name: 'Corridor Smart LED', status: 'Online', type: 'Lighting', brightness: 40, power: 0.8 },
];

let intervalId: ReturnType<typeof setInterval> | null = null;
let bootTime = Date.now();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const jitter = (value: number, delta: number) => value + (Math.random() * 2 - 1) * delta;

const computeMetrics = (devices: IotDevice[], heartbeat: number): TelemetryMetrics => {
  const totalConsumption = devices.reduce((acc, d) => acc + (d.energy ?? d.power ?? d.load ?? 0) * 1, 0);
  const gridStability = clamp(99.5 + Math.sin(heartbeat / 8) * 0.6, 95, 100);
  const systemEfficiency = clamp(86 + Math.cos(heartbeat / 5) * 4, 80, 100);
  const activeAlerts = devices.filter(d => d.status === 'Warning' || d.status === 'Critical' || d.status === 'Offline').length;
  const carbonIntensity = clamp(210 + Math.sin(heartbeat / 7) * 25, 160, 260); // gCO2/kWh
  const latencyMs = clamp(24 + Math.random() * 18, 18, 55);
  const uptimeMinutes = Math.floor((Date.now() - bootTime) / 60000);

  return {
    totalConsumption: Number(totalConsumption.toFixed(1)),
    gridStability: Number(gridStability.toFixed(2)),
    systemEfficiency: Number(systemEfficiency.toFixed(0)),
    activeAlerts,
    carbonIntensity: Number(carbonIntensity.toFixed(0)),
    latencyMs: Number(latencyMs.toFixed(0)),
    uptimeMinutes,
  };
};

const deriveAlerts = (devices: IotDevice[]): IotAlert[] => {
  const alerts: IotAlert[] = [];
  devices.forEach(device => {
    if (device.status === 'Offline') {
      alerts.push({
        id: `alert_off_${device.id}`,
        deviceId: device.id,
        severity: 'critical',
        message: `${device.name} is offline`,
        timestamp: Date.now(),
      });
    }
    if (device.status === 'Warning') {
      alerts.push({
        id: `alert_warn_${device.id}`,
        deviceId: device.id,
        severity: 'warning',
        message: `${device.name} shows abnormal load`,
        timestamp: Date.now(),
      });
    }
  });
  return alerts;
};

const mutateDevice = (device: IotDevice): IotDevice => {
  if (device.status === 'Offline') return device;

  switch (device.type) {
    case 'Climate':
      return {
        ...device,
        temp: Number(clamp(jitter(device.temp ?? 22, 0.4), 18, 29).toFixed(1)),
        load: Number(clamp(jitter(device.load ?? 60, 6), 0, 100).toFixed(0)),
        energy: Number(clamp(jitter(device.energy ?? 4, 0.9), 0, 9).toFixed(1)),
      };
    case 'Lighting':
      return {
        ...device,
        brightness: Number(clamp(jitter(device.brightness ?? 60, 6), 0, 100).toFixed(0)),
        power: Number(clamp(jitter(device.power ?? 1.1, 0.3), 0, 3).toFixed(2)),
      };
    case 'Utility':
      return {
        ...device,
        flow: Number(clamp(jitter(device.flow ?? 120, 4), 40, 180).toFixed(0)),
        pressure: Number(clamp(jitter(device.pressure ?? 55, 1.5), 40, 80).toFixed(0)),
      };
    case 'Power':
      return {
        ...device,
        charge: Number(clamp(jitter(device.charge ?? 98, 0.6), 60, 100).toFixed(0)),
        load: Number(clamp(jitter(device.load ?? 20, 3), 0, 100).toFixed(0)),
      };
    case 'Security':
      return {
        ...device,
        activeNodes: Number(clamp(jitter(device.activeNodes ?? 40, 3), 0, 80).toFixed(0)),
        health: Number(clamp(jitter(device.health ?? 98, 0.8), 50, 100).toFixed(0)),
      };
    case 'Transport':
      return {
        ...device,
        floor: Number(clamp(jitter(device.floor ?? 1, 1), 1, 40).toFixed(0)),
        direction: ['Up', 'Down', 'Idle'][Math.floor(Math.random() * 3)] as IotDevice['direction'],
      };
    default:
      return device;
  }
};

export const startIotStream = (
  onSnapshot?: (snapshot: IotSnapshot) => void,
): (() => void) => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  let devices = seedDevices.map(d => ({ ...d }));
  let tick = 0;

  const emitSnapshot = () => {
    devices = devices.map(mutateDevice);

    // occasional status flips for realism
    if (Math.random() > 0.85) {
      const idx = Math.floor(Math.random() * devices.length);
      const current = devices[idx];
      const nextStatus = current.status === 'Online' && Math.random() > 0.7 ? 'Warning'
        : current.status === 'Warning' && Math.random() > 0.6 ? 'Critical'
        : current.status === 'Critical' && Math.random() > 0.5 ? 'Online'
        : current.status;
      devices[idx] = { ...current, status: nextStatus };
    }

    const metrics = computeMetrics(devices, tick);
    const alerts = deriveAlerts(devices);
    const snapshot: IotSnapshot = { devices, metrics, alerts, lastUpdated: Date.now() };

    systemBus.emit('iot:telemetry', snapshot);
    onSnapshot?.(snapshot);
    tick += 1;
  };

  emitSnapshot();
  intervalId = setInterval(emitSnapshot, 2000);

  return () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  };
};

export const sendIotCommand = async (device: IotDevice, action: 'RESTART' | 'DIAGNOSTIC' | 'SHUTDOWN') => {
  // Simulate network delay and success probability
  const latency = 120 + Math.random() * 220;
  await new Promise(res => setTimeout(res, latency));

  const succeeded = device.status !== 'Offline' && Math.random() > 0.05;
  const status = succeeded ? 'SUCCESS' : 'ERROR';
  const details = succeeded
    ? `Command ${action} acknowledged by ${device.id} (${latency.toFixed(0)}ms)`
    : `Command ${action} failed: ${device.id} unreachable`;

  botEngine.logActivity('IOT', action, details, 'IOTControlCenter', status as 'SUCCESS' | 'ERROR');
  systemBus.emit('iot:command', { deviceId: device.id, action, latency, status });

  return { latency, status, details };
};

export const stopIotStream = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
};
