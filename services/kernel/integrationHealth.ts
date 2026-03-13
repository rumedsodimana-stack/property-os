import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { aiProvider } from '../intelligence/aiProvider';
import { auth, db, functions, useFirebaseEmulators } from './firebase';
import { SERVICE_ENDPOINTS } from '../../src/config/app';

export type IntegrationProbe = {
    ready: boolean;
    message: string;
    latencyMs?: number;
    errorCode?: string;
};

export interface IntegrationHealthStatus {
    checkedAt: number;
    overall: 'healthy' | 'degraded' | 'down';
    emulatorsEnabled: boolean;
    firebaseAuth: IntegrationProbe;
    firestore: IntegrationProbe;
    functions: IntegrationProbe;
    aiProvider: IntegrationProbe & {
        provider: 'openai' | 'gemini' | 'anthropic' | 'ollama';
    };
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
};

const toErrorMessage = (error: unknown): { message: string; code?: string } => {
    const rawCode = (error as { code?: string })?.code;
    const code = typeof rawCode === 'string' ? rawCode : undefined;
    const message = String((error as { message?: string })?.message || error || 'Unknown error');

    if (message.toLowerCase().includes('permission') || code?.includes('permission-denied')) {
        return { message: 'Permission denied. Check Firestore rules and role claims.', code };
    }
    if (message.toLowerCase().includes('unavailable')) {
        return { message: 'Service unavailable. Verify Firebase project connectivity.', code };
    }
    if (message.toLowerCase().includes('timeout')) {
        return { message: 'Health probe timed out. Service may be unreachable.', code };
    }

    return { message, code };
};

class IntegrationHealthService {
    private latest: IntegrationHealthStatus = {
        checkedAt: 0,
        overall: 'down',
        emulatorsEnabled: useFirebaseEmulators,
        firebaseAuth: { ready: false, message: 'Not checked yet' },
        firestore: { ready: false, message: 'Not checked yet' },
        functions: { ready: false, message: 'Not checked yet' },
        aiProvider: { ready: false, message: 'Not checked yet', provider: 'ollama' },
    };

    private inFlight: Promise<IntegrationHealthStatus> | null = null;
    private listeners = new Set<(status: IntegrationHealthStatus) => void>();

    getLatestStatus(): IntegrationHealthStatus {
        return this.latest;
    }

    subscribe(listener: (status: IntegrationHealthStatus) => void): () => void {
        this.listeners.add(listener);
        listener(this.latest);
        return () => {
            this.listeners.delete(listener);
        };
    }

    async checkNow(): Promise<IntegrationHealthStatus> {
        if (this.inFlight) return this.inFlight;

        this.inFlight = this.runChecks().finally(() => {
            this.inFlight = null;
        });

        return this.inFlight;
    }

    private notify(): void {
        this.listeners.forEach((listener) => listener(this.latest));
    }

    private async runChecks(): Promise<IntegrationHealthStatus> {
        const checkedAt = Date.now();

        const authProbe = this.checkAuth();
        const firestoreProbe = this.checkFirestore();
        const functionsProbe = this.checkFunctions();
        const aiProbe = this.checkAIProvider();

        const [firebaseAuth, firestore, functionsResult, aiProviderResult] = await Promise.all([
            authProbe,
            firestoreProbe,
            functionsProbe,
            aiProbe,
        ]);

        const readiness = [firebaseAuth.ready, firestore.ready, functionsResult.ready, aiProviderResult.ready];
        const readyCount = readiness.filter(Boolean).length;

        const overall: IntegrationHealthStatus['overall'] = readyCount === readiness.length
            ? 'healthy'
            : readyCount === 0
                ? 'down'
                : 'degraded';

        this.latest = {
            checkedAt,
            overall,
            emulatorsEnabled: useFirebaseEmulators,
            firebaseAuth,
            firestore,
            functions: functionsResult,
            aiProvider: aiProviderResult,
        };

        this.notify();
        return this.latest;
    }

    private checkAuth(): IntegrationProbe {
        if (!auth.currentUser) {
            return {
                ready: false,
                message: 'No authenticated Firebase user. Login is required.',
            };
        }

        return {
            ready: true,
            message: `Authenticated as ${auth.currentUser.uid}`,
        };
    }

    private async checkFirestore(): Promise<IntegrationProbe> {
        const started = Date.now();
        try {
            if (!auth.currentUser) {
                return {
                    ready: false,
                    message: 'Firestore probe skipped because auth session is missing.',
                };
            }

            const probeDoc = doc(db, 'systemConfig', 'businessDate');
            await withTimeout(getDoc(probeDoc), 5000);

            return {
                ready: true,
                message: 'Firestore read probe passed.',
                latencyMs: Date.now() - started,
            };
        } catch (error) {
            const normalized = toErrorMessage(error);
            return {
                ready: false,
                message: normalized.message,
                errorCode: normalized.code,
                latencyMs: Date.now() - started,
            };
        }
    }

    private async checkFunctions(): Promise<IntegrationProbe> {
        const started = Date.now();
        try {
            const backendHealth = httpsCallable<unknown, { ok?: boolean }>(functions, 'backendHealth');
            const result = await withTimeout(backendHealth({}), 5000);
            const ok = !!result.data?.ok;
            return {
                ready: ok,
                message: ok ? 'Callable functions are reachable.' : 'Functions responded without expected health payload.',
                latencyMs: Date.now() - started,
            };
        } catch (error) {
            const normalized = toErrorMessage(error);
            return {
                ready: false,
                message: normalized.message,
                errorCode: normalized.code,
                latencyMs: Date.now() - started,
            };
        }
    }

    private async checkAIProvider(): Promise<IntegrationHealthStatus['aiProvider']> {
        const started = Date.now();
        const runtimeConfig = aiProvider.getRuntimeConfig();
        const provider = runtimeConfig.provider;

        try {
            if (provider === 'ollama') {
                const baseUrl = (runtimeConfig.ollamaUrl || SERVICE_ENDPOINTS.ollama).replace(/\/$/, '');
                const response = await withTimeout(fetch(`${baseUrl}/api/tags`, { method: 'GET' }), 3500);
                if (!response.ok) {
                    return {
                        provider,
                        ready: false,
                        message: `Ollama responded with HTTP ${response.status}.`,
                        latencyMs: Date.now() - started,
                    };
                }

                return {
                    provider,
                    ready: true,
                    message: 'Ollama runtime reachable.',
                    latencyMs: Date.now() - started,
                };
            }

            if (!runtimeConfig.apiKey) {
                return {
                    provider,
                    ready: false,
                    message: `Missing API key for ${provider}.`,
                    latencyMs: Date.now() - started,
                };
            }

            return {
                provider,
                ready: true,
                message: `${provider} is configured with an API key.`,
                latencyMs: Date.now() - started,
            };
        } catch (error) {
            const normalized = toErrorMessage(error);
            return {
                provider,
                ready: false,
                message: normalized.message,
                errorCode: normalized.code,
                latencyMs: Date.now() - started,
            };
        }
    }
}

export const integrationHealthService = new IntegrationHealthService();
