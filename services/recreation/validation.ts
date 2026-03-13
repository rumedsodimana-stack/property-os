export const requireString = (value: unknown, name: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    throw new Error(`${name} is required`);
};

export const requireDateIso = (value: unknown, name: string): string => {
    if (typeof value !== 'string') throw new Error(`${name} must be an ISO date`);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new Error(`${name} is invalid date`);
    return d.toISOString();
};

export const requireNonNegative = (value: unknown, name: string): number => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) throw new Error(`${name} must be non-negative number`);
    return num;
};
