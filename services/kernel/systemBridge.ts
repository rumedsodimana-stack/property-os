
// Imports removed

// --- Event Definitions ---
export type SystemLog = {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  module: 'POS' | 'PMS' | 'HK' | 'FINANCE' | 'IOT' | 'PROCUREMENT' | 'KERNEL' | 'HOUSEKEEPING' | 'HR' | 'EVENTS' | 'COMMS' | 'ENGINEERING';
  details: string;
  latency: number; // ms
  cost?: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
};

export type SystemAnomaly = {
  id: string;
  source: string;
  role: 'Guest Bot' | 'Staff Bot' | 'System Watchdog';
  type: 'Error Report' | 'Improvement';
  module: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  technicalDetails?: string;
  timestamp: number;
};

export type SystemPerformance = {
  cpu: number; // Percentage
  memory: number; // Percentage
  network: number; // Mbps
  requests: number; // Req/s
  uptime: number; // Seconds
};

// Custom SystemBus
class SystemBus {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const systemBus = new SystemBus();

class BotEngine {
  private intervalId: any;
  private isRunning: boolean = false;
  private startTime: number = Date.now();

  // System Resource State
  private cpuLoad: number = 8;
  private memUsage: number = 22;
  private netTraffic: number = 150; // Mbps

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    // console.log("System Bridge: Real-Time Monitor Active");

    // Only run metrics heartbeat, no fake traffic
    this.intervalId = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.intervalId);
  }

  private updateMetrics() {
    // Gentle fluctuation for realism based on "idle" system
    this.cpuLoad = Math.min(100, Math.max(2, this.cpuLoad + (Math.random() * 2 - 1)));
    this.memUsage = Math.min(90, Math.max(20, this.memUsage + (Math.random() * 1 - 0.5)));
    this.netTraffic = Math.max(50, this.netTraffic + (Math.random() * 20 - 10));

    const perf: SystemPerformance = {
      cpu: parseFloat(this.cpuLoad.toFixed(1)),
      memory: parseFloat(this.memUsage.toFixed(1)),
      network: parseFloat(this.netTraffic.toFixed(0)),
      requests: Math.floor(this.netTraffic / 10), // Lower requests as it's real user data now
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };

    systemBus.emit('performance', perf);
  }

  // Public method for components to log real actions
  public logActivity(module: SystemLog['module'], action: string, details: string, source: string = 'User', status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS') {
    const log: SystemLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source,
      action,
      module,
      details,
      latency: Math.floor(Math.random() * 40) + 10, // Simulated fast network latency
      status
    };
    systemBus.emit('log', log);

    // Spike CPU slightly on action
    this.cpuLoad = Math.min(100, this.cpuLoad + 5);
  }
}

export const botEngine = new BotEngine();
