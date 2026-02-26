import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ─── Data Model ───────────────────────────────────────────────────────────────

interface Node {
    id: string;
    label: string;
    sublabel?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'module' | 'service' | 'database' | 'ai' | 'external' | 'sub';
    color: string;
    glow: string;
    icon: string;
    children?: string[];
}

interface Edge {
    from: string;
    to: string;
    label?: string;
    dashed?: boolean;
    color?: string;
}

const NODES: Node[] = [
    // ─── Core Modules ───────────────────────────────────────────────────────────
    { id: 'frontdesk', label: 'Front Desk', sublabel: 'Reservations · Rooms · Guests', x: 480, y: 180, w: 200, h: 70, type: 'module', color: '#052e16', glow: '#10b981', icon: '🛎️' },
    { id: 'housekeeping', label: 'Housekeeping', sublabel: 'Room Status · Tasks · Staff', x: 720, y: 180, w: 200, h: 70, type: 'module', color: '#0f172a', glow: '#6366f1', icon: '🧹' },
    { id: 'pos', label: 'F&B / POS', sublabel: 'Orders · Outlets · Tables', x: 960, y: 180, w: 200, h: 70, type: 'module', color: '#1c0a00', glow: '#f97316', icon: '🍽️' },
    { id: 'hr', label: 'HR & Payroll', sublabel: 'Staff · Roster · Payroll', x: 480, y: 360, w: 200, h: 70, type: 'module', color: '#1a0030', glow: '#a855f7', icon: '👥' },
    { id: 'finance', label: 'Finance', sublabel: 'GL · Folios · Accounts', x: 720, y: 360, w: 200, h: 70, type: 'module', color: '#0a0a00', glow: '#eab308', icon: '💰' },
    { id: 'procurement', label: 'Procurement', sublabel: 'POs · RFQs · Suppliers', x: 960, y: 360, w: 200, h: 70, type: 'module', color: '#00120a', glow: '#22c55e', icon: '📦' },
    { id: 'engineering', label: 'Engineering', sublabel: 'Assets · Tickets · IoT', x: 480, y: 540, w: 200, h: 70, type: 'module', color: '#0c0800', glow: '#f59e0b', icon: '🔧' },
    { id: 'events', label: 'Event Management', sublabel: 'Banquets · AV · Catering', x: 720, y: 540, w: 200, h: 70, type: 'module', color: '#00101a', glow: '#38bdf8', icon: '🎪' },
    { id: 'brand', label: 'Brand Standards', sublabel: 'Documents · AI Analysis', x: 960, y: 540, w: 200, h: 70, type: 'module', color: '#120010', glow: '#ec4899', icon: '🎨' },
    { id: 'config', label: 'Configuration', sublabel: 'Property · POS · Permissions', x: 720, y: 720, w: 200, h: 70, type: 'module', color: '#0d0d0d', glow: '#94a3b8', icon: '⚙️' },

    // ─── Sub-systems ────────────────────────────────────────────────────────────
    { id: 'roster', label: 'Roster Builder', sublabel: 'Shift patterns · AI scheduling', x: 240, y: 310, w: 190, h: 60, type: 'sub', color: '#1a0030', glow: '#a855f7', icon: '📅' },
    { id: 'payroll', label: 'Payroll Engine', sublabel: 'Benefits · Tax · YTD', x: 240, y: 400, w: 190, h: 60, type: 'sub', color: '#1a0030', glow: '#a855f7', icon: '💵' },
    { id: 'permissions', label: 'RBAC Permissions', sublabel: '11 modules × 6 actions', x: 540, y: 760, w: 190, h: 60, type: 'sub', color: '#0d0d0d', glow: '#94a3b8', icon: '🛡️' },
    { id: 'onboarding', label: 'Room Onboarding', sublabel: 'DNA · Traits · Blueprint', x: 900, y: 760, w: 190, h: 60, type: 'sub', color: '#0d0d0d', glow: '#94a3b8', icon: '🏨' },
    { id: 'posorder', label: 'Order Entry', sublabel: 'POS terminal & folio posting', x: 1200, y: 130, w: 190, h: 60, type: 'sub', color: '#1c0a00', glow: '#f97316', icon: '🧾' },
    { id: 'oracle', label: 'Oracle Widget', sublabel: 'AI concierge overlay', x: 240, y: 130, w: 190, h: 60, type: 'ai', color: '#0d001a', glow: '#7c3aed', icon: '🔮' },
    { id: 'inspector', label: 'Inspector Shell', sublabel: 'Context panel · Deep dive', x: 240, y: 220, w: 190, h: 60, type: 'sub', color: '#0d0d0d', glow: '#64748b', icon: '🔍' },

    // ─── Services ───────────────────────────────────────────────────────────────
    { id: 'persistence', label: 'Persistence (usePms)', sublabel: 'Global Firestore subscriptions', x: 700, y: 930, w: 230, h: 70, type: 'service', color: '#001030', glow: '#3b82f6', icon: '🔗' },
    { id: 'firestoreS', label: 'firestoreService', sublabel: 'CRUD · subscribeToItems', x: 480, y: 1080, w: 210, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '⚡' },
    { id: 'rosterSvc', label: 'rosterService', sublabel: 'ShiftPattern · RosterShift', x: 240, y: 1080, w: 190, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '⚡' },
    { id: 'roleSvc', label: 'roleService', sublabel: 'SystemRole · RBAC', x: 720, y: 1080, w: 190, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '⚡' },
    { id: 'brandSvc', label: 'brandServiceBus', sublabel: 'Pub/Sub event bus', x: 960, y: 1080, w: 190, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '⚡' },
    { id: 'posToFolio', label: 'posToFolioService', sublabel: 'POS → Folio event bridge', x: 1200, y: 1080, w: 190, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '⚡' },
    { id: 'codeGen', label: 'codeGenerator', sublabel: 'AST-based self-modification', x: 1200, y: 930, w: 190, h: 60, type: 'ai', color: '#0d001a', glow: '#7c3aed', icon: '🧬' },
    { id: 'deployOrch', label: 'deploymentOrchestrator', sublabel: 'Brand adaptation pipeline', x: 1400, y: 930, w: 200, h: 60, type: 'ai', color: '#0d001a', glow: '#7c3aed', icon: '🚀' },
    { id: 'brandAI', label: 'brandStandardsAI', sublabel: 'OpenAI/Gemini document analysis', x: 1400, y: 1080, w: 200, h: 60, type: 'ai', color: '#0d001a', glow: '#7c3aed', icon: '🤖' },
    { id: 'authService', label: 'authService', sublabel: 'Firebase Auth · Google SSO', x: 240, y: 930, w: 190, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '🔐' },
    { id: 'systemBridge', label: 'systemBridge / botEngine', sublabel: 'Activity logging · AI bus', x: 480, y: 930, w: 210, h: 60, type: 'service', color: '#001030', glow: '#60a5fa', icon: '🌉' },

    // ─── Database ───────────────────────────────────────────────────────────────
    { id: 'firestore', label: 'Firestore', sublabel: '30+ collections · Real-time', x: 650, y: 1250, w: 280, h: 80, type: 'database', color: '#001a0a', glow: '#34d399', icon: '🔥' },

    // ─── External ───────────────────────────────────────────────────────────────
    { id: 'openai', label: 'OpenAI / Gemini', sublabel: 'GPT-4 · Property intelligence', x: 1200, y: 1250, w: 200, h: 70, type: 'external', color: '#0a000a', glow: '#d946ef', icon: '✨' },
    { id: 'firebase', label: 'Firebase Platform', sublabel: 'Auth · Hosting · Functions', x: 900, y: 1250, w: 200, h: 70, type: 'external', color: '#1a0500', glow: '#fb923c', icon: '☁️' },

    // ─── Entry Points ────────────────────────────────────────────────────────────
    { id: 'opsapp', label: 'OpsApp', sublabel: 'Staff dashboard shell', x: 720, y: -20, w: 200, h: 60, type: 'sub', color: '#0d0d0d', glow: '#94a3b8', icon: '🖥️' },
    { id: 'guestapp', label: 'GuestApp', sublabel: 'Guest-facing mobile portal', x: 480, y: -20, w: 190, h: 60, type: 'sub', color: '#001a0a', glow: '#34d399', icon: '📱' },
];

const EDGES: Edge[] = [
    // OpsApp → Modules
    { from: 'opsapp', to: 'frontdesk', color: '#4b5563' },
    { from: 'opsapp', to: 'housekeeping', color: '#4b5563' },
    { from: 'opsapp', to: 'pos', color: '#4b5563' },
    { from: 'opsapp', to: 'hr', color: '#4b5563' },
    { from: 'opsapp', to: 'finance', color: '#4b5563' },
    { from: 'opsapp', to: 'events', color: '#4b5563' },
    { from: 'opsapp', to: 'brand', color: '#4b5563' },
    { from: 'opsapp', to: 'config', color: '#4b5563' },
    // GuestApp
    { from: 'guestapp', to: 'oracle', color: '#34d399' },
    // HR sub
    { from: 'hr', to: 'roster', label: 'Roster tab', color: '#a855f7' },
    { from: 'hr', to: 'payroll', label: 'Payroll tab', color: '#a855f7' },
    // Config sub
    { from: 'config', to: 'permissions', label: 'RBAC tab', color: '#94a3b8' },
    { from: 'config', to: 'onboarding', label: 'Rooms tab', color: '#94a3b8' },
    // POS sub
    { from: 'pos', to: 'posorder', label: 'Terminal', color: '#f97316' },
    { from: 'posorder', to: 'posToFolio', label: 'Posting event', color: '#f97316' },
    // Oracle & Inspector
    { from: 'oracle', to: 'frontdesk', label: 'AI concierge', color: '#7c3aed', dashed: true },
    { from: 'inspector', to: 'frontdesk', label: 'Context panel', color: '#64748b', dashed: true },
    // All modules → persistence
    { from: 'frontdesk', to: 'persistence', color: '#3b82f6' },
    { from: 'housekeeping', to: 'persistence', color: '#3b82f6' },
    { from: 'pos', to: 'persistence', color: '#3b82f6' },
    { from: 'hr', to: 'persistence', color: '#3b82f6' },
    { from: 'finance', to: 'persistence', color: '#3b82f6' },
    { from: 'procurement', to: 'persistence', color: '#3b82f6' },
    { from: 'engineering', to: 'persistence', color: '#3b82f6' },
    { from: 'events', to: 'persistence', color: '#3b82f6' },
    { from: 'config', to: 'persistence', color: '#3b82f6' },
    // Services
    { from: 'roster', to: 'rosterSvc', color: '#60a5fa' },
    { from: 'permissions', to: 'roleSvc', color: '#60a5fa' },
    { from: 'brand', to: 'brandSvc', color: '#ec4899' },
    { from: 'brand', to: 'codeGen', color: '#7c3aed', dashed: true },
    { from: 'codeGen', to: 'deployOrch', label: 'AST pipeline', color: '#7c3aed' },
    { from: 'deployOrch', to: 'brandAI', label: 'AI analysis', color: '#7c3aed', dashed: true },
    { from: 'brandAI', to: 'openai', color: '#d946ef' },
    { from: 'authService', to: 'firebase', color: '#fb923c' },
    { from: 'systemBridge', to: 'persistence', color: '#60a5fa', dashed: true },
    // persistence → lower services
    { from: 'persistence', to: 'firestoreS', color: '#3b82f6' },
    { from: 'rosterSvc', to: 'firestoreS', color: '#60a5fa' },
    { from: 'roleSvc', to: 'firestoreS', color: '#60a5fa' },
    { from: 'posToFolio', to: 'firestoreS', color: '#60a5fa' },
    { from: 'brandSvc', to: 'firestoreS', color: '#60a5fa' },
    // firestoreService → Firestore DB
    { from: 'firestoreS', to: 'firestore', label: 'CRUD / subscribe', color: '#34d399' },
    { from: 'firestore', to: 'firebase', label: 'Hosted on', color: '#fb923c' },
    // On-boarding → Firestore
    { from: 'onboarding', to: 'firestoreS', label: 'addItem (rooms)', color: '#94a3b8' },
];

// ─── Canvas Renderer ─────────────────────────────────────────────────────────

function nodeCenter(n: Node) {
    return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function nodeById(id: string) {
    return NODES.find(n => n.id === id);
}

const TYPE_META: Record<Node['type'], { border: string; label: string }> = {
    module: { border: '#ffffff22', label: 'Module' },
    service: { border: '#3b82f655', label: 'Service' },
    database: { border: '#34d39966', label: 'Database' },
    ai: { border: '#7c3aed66', label: 'AI' },
    external: { border: '#f9731655', label: 'External' },
    sub: { border: '#64748b44', label: 'Sub-system' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

const SystemMap: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pan, setPan] = useState({ x: 80, y: 40 });
    const [zoom, setZoom] = useState(0.55);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const isDragging = useRef(false);
    const lastPan = useRef({ x: 0, y: 0 });

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Background grid
        ctx.fillStyle = '#080812';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // Draw grid dots
        const gridSize = 40;
        ctx.fillStyle = '#ffffff08';
        for (let gx = -200; gx < 2000; gx += gridSize) {
            for (let gy = -200; gy < 2000; gy += gridSize) {
                ctx.beginPath();
                ctx.arc(gx, gy, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw edges first
        EDGES.forEach(edge => {
            const from = nodeById(edge.from);
            const to = nodeById(edge.to);
            if (!from || !to) return;

            const fc = nodeCenter(from);
            const tc = nodeCenter(to);
            const color = edge.color ?? '#4b5563';

            const isHighlighted = (selectedNode === edge.from || selectedNode === edge.to ||
                hoveredNode === edge.from || hoveredNode === edge.to);

            ctx.beginPath();
            ctx.setLineDash(edge.dashed ? [6, 4] : []);

            // Curved bezier
            const mx = (fc.x + tc.x) / 2;
            const my = (fc.y + tc.y) / 2 - 20;
            ctx.moveTo(fc.x, fc.y);
            ctx.quadraticCurveTo(mx, my, tc.x, tc.y);

            ctx.strokeStyle = isHighlighted ? color + 'ff' : color + '55';
            ctx.lineWidth = isHighlighted ? 2 : 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow head
            const angle = Math.atan2(tc.y - my, tc.x - mx);
            const arrowSize = 7;
            ctx.fillStyle = isHighlighted ? color + 'ff' : color + '55';
            ctx.beginPath();
            ctx.moveTo(tc.x, tc.y);
            ctx.lineTo(tc.x - arrowSize * Math.cos(angle - 0.4), tc.y - arrowSize * Math.sin(angle - 0.4));
            ctx.lineTo(tc.x - arrowSize * Math.cos(angle + 0.4), tc.y - arrowSize * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fill();

            // Edge label
            if (edge.label && isHighlighted) {
                ctx.fillStyle = '#ffffff99';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(edge.label, mx, my - 5);
            }
        });

        // Draw nodes
        NODES.forEach(node => {
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const meta = TYPE_META[node.type];

            const glow = isHovered || isSelected ? node.glow : 'transparent';
            const alpha = isHovered || isSelected ? 0.25 : 0.12;

            // Glow shadow
            if (isHovered || isSelected) {
                ctx.shadowColor = node.glow;
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowBlur = 0;
            }

            // Box background
            const gradient = ctx.createLinearGradient(node.x, node.y, node.x + node.w, node.y + node.h);
            gradient.addColorStop(0, node.color);
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(node.x, node.y, node.w, node.h, 10);
            ctx.fill();

            // Border
            ctx.strokeStyle = isSelected ? node.glow : isHovered ? node.glow + 'aa' : meta.border;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Icon
            ctx.font = `${node.h > 65 ? 18 : 14}px serif`;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(node.icon, node.x + 10, node.y + (node.h > 65 ? 28 : 22));

            // Label
            ctx.font = `bold ${node.h > 65 ? 13 : 11}px -apple-system, "Inter", sans-serif`;
            ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#d4d4d8';
            ctx.textAlign = 'left';
            ctx.fillText(node.label, node.x + 36, node.y + (node.h > 65 ? 28 : 22));

            // Sublabel
            if (node.sublabel) {
                ctx.font = `${node.h > 65 ? 9.5 : 8.5}px -apple-system, "Inter", sans-serif`;
                ctx.fillStyle = '#71717a';
                ctx.fillText(node.sublabel, node.x + 36, node.y + (node.h > 65 ? 46 : 38));
            }

            // Type badge
            ctx.font = '7px monospace';
            ctx.fillStyle = node.glow + 'bb';
            ctx.textAlign = 'right';
            ctx.fillText(meta.label.toUpperCase(), node.x + node.w - 8, node.y + 11);
        });

        ctx.restore();

        // Legend (fixed screen coords)
        const legendItems = Object.entries(TYPE_META);
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#71717a';
        ctx.textAlign = 'left';
        ctx.fillText('LEGEND', 20, H - 20 - legendItems.length * 22);
        legendItems.forEach(([type, meta], i) => {
            const node = NODES.find(n => n.type === (type as Node['type']));
            const y = H - legendItems.length * 22 + i * 22;
            ctx.fillStyle = node?.glow ?? '#4b5563';
            ctx.fillRect(20, y - 10, 14, 14);
            ctx.fillStyle = '#a1a1aa';
            ctx.font = '10px monospace';
            ctx.fillText(meta.label, 40, y);
        });

        // Zoom indicator
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(W - 120, H - 40, 100, 28);
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(zoom * 100)}% zoom`, W - 70, H - 22);

    }, [pan, zoom, hoveredNode, selectedNode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        draw();
    }, [draw]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            draw();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    const worldPos = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - pan.x) / zoom,
            y: (clientY - rect.top - pan.y) / zoom,
        };
    };

    const hitTest = (wx: number, wy: number) => {
        return NODES.find(n => wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        if (isDragging.current) {
            setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
        } else {
            const { x, y } = worldPos(e.clientX, e.clientY, canvas);
            const node = hitTest(x, y);
            setHoveredNode(node?.id ?? null);
            canvas.style.cursor = node ? 'pointer' : 'grab';
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const { x, y } = worldPos(e.clientX, e.clientY, canvas);
        const node = hitTest(x, y);
        if (node) {
            setSelectedNode(prev => prev === node.id ? null : node.id);
        } else {
            isDragging.current = true;
            canvas.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setZoom(z => Math.max(0.2, Math.min(2.5, z * factor)));
    };

    const selectedNodeData = selectedNode ? NODES.find(n => n.id === selectedNode) : null;
    const connectedEdges = selectedNode
        ? EDGES.filter(e => e.from === selectedNode || e.to === selectedNode)
        : [];

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#080812', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, Inter, sans-serif', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#0d0d1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⬡</div>
                    <div>
                        <div style={{ color: '#e4e4e7', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>HOTEL SINGULARITY OS</div>
                        <div style={{ color: '#52525b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em' }}>System Architecture Map</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { label: '–', action: () => setZoom(z => Math.max(0.2, z - 0.1)) },
                        { label: 'Reset', action: () => { setZoom(0.55); setPan({ x: 80, y: 40 }); } },
                        { label: '+', action: () => setZoom(z => Math.min(2.5, z + 0.1)) },
                    ].map(btn => (
                        <button key={btn.label} onClick={btn.action} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #3f3f46', background: '#18181b', color: '#a1a1aa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {btn.label}
                        </button>
                    ))}
                    <a href="/" style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #7c3aed55', background: '#7c3aed22', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        ← Back to App
                    </a>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    style={{ flex: 1, cursor: 'grab', display: 'block' }}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                />

                {/* Side panel */}
                {selectedNodeData && (
                    <div style={{
                        width: 280, borderLeft: '1px solid #1e1e2e', background: '#0d0d1a',
                        padding: 20, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 22 }}>{selectedNodeData.icon}</span>
                            <button onClick={() => setSelectedNode(null)}
                                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#e4e4e7' }}>{selectedNodeData.label}</div>
                            <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{selectedNodeData.sublabel}</div>
                            <div style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 20, border: `1px solid ${selectedNodeData.glow}55`, background: `${selectedNodeData.glow}15`, color: selectedNodeData.glow, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {TYPE_META[selectedNodeData.type].label}
                            </div>
                        </div>

                        {connectedEdges.length > 0 && (
                            <div>
                                <div style={{ fontSize: 9, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>Connections</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {connectedEdges.map((edge, i) => {
                                        const other = edge.from === selectedNode ? nodeById(edge.to) : nodeById(edge.from);
                                        const isOut = edge.from === selectedNode;
                                        if (!other) return null;
                                        return (
                                            <div key={i} onClick={() => setSelectedNode(other.id)} style={{
                                                padding: '8px 10px', borderRadius: 8, border: `1px solid ${other.glow}33`,
                                                background: `${other.glow}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                                            }}>
                                                <span style={{ color: isOut ? '#34d399' : '#60a5fa', fontSize: 12 }}>{isOut ? '→' : '←'}</span>
                                                <div>
                                                    <div style={{ fontSize: 11, color: '#d4d4d8', fontWeight: 600 }}>{other.icon} {other.label}</div>
                                                    {edge.label && <div style={{ fontSize: 9, color: '#71717a' }}>{edge.label}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', padding: '10px', borderRadius: 8, background: '#18181b', border: '1px solid #27272a' }}>
                            <div style={{ fontSize: 9, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Position</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>x: {selectedNodeData.x} · y: {selectedNodeData.y}</div>
                            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>w: {selectedNodeData.w} · h: {selectedNodeData.h}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div style={{ padding: '8px 20px', borderTop: '1px solid #1e1e2e', background: '#0d0d1a', display: 'flex', gap: 24, flexShrink: 0 }}>
                {[
                    ['🖱️ Drag', 'Pan the canvas'],
                    ['🖱️ Scroll', 'Zoom in/out'],
                    ['🖱️ Click node', 'Select & view connections'],
                    [`${NODES.length} nodes`, `${EDGES.length} connections`],
                ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#52525b' }}>{k}</span>
                        <span style={{ fontSize: 10, color: '#3f3f46' }}>·</span>
                        <span style={{ fontSize: 10, color: '#3f3f46' }}>{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('system-map-root')!);
root.render(<SystemMap />);
