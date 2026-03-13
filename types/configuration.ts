export interface PropertyAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface PropertyContact {
    phone: string;
    email: string;
    website: string;
}

export interface OperationalSettings {
    checkInTime: string; // HH:mm
    checkOutTime: string; // HH:mm
    currency: string;
    timezone: string;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
}

export interface PropertyFeatures {
    parking: boolean;
    pool: boolean;
    gym: boolean;
    spa: boolean;
    restaurant: boolean;
    bar: boolean;
    roomService: boolean;
    wifi: 'free' | 'paid' | 'none';
}

export interface BrandSettings {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
}

export interface PropertyConfiguration {
    id: string;
    name: string;
    brandName?: string;
    type: 'Hotel' | 'Resort' | 'Motel' | 'Boutique' | 'Other';
    address: PropertyAddress;
    contact: PropertyContact;
    operations: OperationalSettings;
    features: PropertyFeatures;
    branding: BrandSettings;
    lastUpdated: string;
}

export const defaultPropertyConfig: PropertyConfiguration = {
    id: 'default_prop',
    name: 'Hotel Singularity',
    type: 'Hotel',
    address: {
        street: '123 Innovation Dr',
        city: 'Tech City',
        state: 'CA',
        postalCode: '90210',
        country: 'USA'
    },
    contact: {
        phone: '+1 (555) 012-3456',
        email: 'info@hotelsingularity.com',
        website: 'www.hotelsingularity.com'
    },
    operations: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        currency: 'USD',
        timezone: 'UTC-8',
        cancellationPolicy: 'flexible'
    },
    features: {
        parking: true,
        pool: true,
        gym: true,
        spa: false,
        restaurant: true,
        bar: true,
        roomService: true,
        wifi: 'free'
    },
    branding: {
        primaryColor: '#8b5cf6', // Violet-500
        secondaryColor: '#10b981' // Emerald-500
    },
    lastUpdated: new Date().toISOString()
};

export interface BuilderSandboxConfiguration {
    enabled: boolean;
    writablePathPrefixes: string[];
    blockedPathSegments: string[];
    allowedExtensions: string[];
    maxWriteBytes: number;
}

export interface BuilderAutopilotConfiguration {
    enabled: boolean;
    cycleIntervalSeconds: number;
    maxConcurrentCycles: number;
}

export interface BuilderConfiguration {
    enabled: boolean;
    owner: string;
    benchmarkTargets: string[];
    autopilot: BuilderAutopilotConfiguration;
    sandbox: BuilderSandboxConfiguration;
    lastRunAt?: string;
}

export const defaultBuilderConfiguration: BuilderConfiguration = {
    enabled: true,
    owner: 'SYSTEM',
    benchmarkTargets: ['Oracle OPERA Cloud', 'Mews', 'Cloudbeds', 'Stayntouch', 'Apaleo'],
    autopilot: {
        enabled: false,
        cycleIntervalSeconds: 120,
        maxConcurrentCycles: 1
    },
    sandbox: {
        enabled: true,
        writablePathPrefixes: ['components/', 'services/', 'context/', 'src/', 'types/', 'docs/', 'public/', 'App.tsx', 'index.css', 'index.html'],
        blockedPathSegments: ['..', '.git', '.env', 'node_modules', 'dist/', '.firebase', '.singularity_backups', 'edgeNode/'],
        allowedExtensions: ['.ts', '.tsx', '.css', '.json', '.md', '.html'],
        maxWriteBytes: 300000
    }
};
