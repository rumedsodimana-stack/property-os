/**
 * Document Type Configurations
 * Visual identity (colors, icons) for each document type
 */
import { colors } from '../../src/theme';
import {
    Palette, FileText, FileSignature, Clipboard, AlertTriangle,
    Search, Users, DollarSign, GraduationCap, File
} from 'lucide-react';

export const documentTypeConfig = {
    brand_asset: {
        label: 'Brand Asset',
        icon: Palette,
        color: colors.violet400,
        gradient: 'from-violet-500 to-purple-600',
        description: 'Logos, color palettes, typography guides'
    },
    certificate: {
        label: 'Certificate',
        icon: FileText,
        color: colors.emerald500, // emerald-500
        gradient: 'from-emerald-500 to-green-600',
        description: 'Health permits, fire safety, ISO certifications'
    },
    agreement: {
        label: 'Agreement',
        icon: FileSignature,
        color: colors.blue500, // blue-500
        gradient: 'from-blue-500 to-indigo-600',
        description: 'Vendor contracts, NDAs, service agreements'
    },
    sop: {
        label: 'SOP',
        icon: Clipboard,
        color: 'var(--brand-accent)', // brand accent
        gradient: 'from-[var(--brand-accent)] to-orange-600',
        description: 'Standard Operating Procedures'
    },
    sos: {
        label: 'SOS',
        icon: AlertTriangle,
        color: colors.red500, // red-500
        gradient: 'from-red-500 to-rose-600',
        description: 'Emergency protocols, evacuation plans'
    },
    audit: {
        label: 'Audit Document',
        icon: Search,
        color: colors.cyan500, // cyan-500
        gradient: 'from-cyan-500 to-blue-600',
        description: 'External audit reports, compliance checks'
    },
    hr_document: {
        label: 'HR Document',
        icon: Users,
        color: colors.pink500, // pink-500
        gradient: 'from-pink-500 to-rose-600',
        description: 'CVs, employee contracts, performance reviews'
    },
    financial: {
        label: 'Financial',
        icon: DollarSign,
        color: colors.green500, // green-500
        gradient: 'from-green-500 to-emerald-600',
        description: 'Invoices, budgets, financial statements'
    },
    training: {
        label: 'Training Material',
        icon: GraduationCap,
        color: colors.orange500, // orange-500
        gradient: 'from-orange-500 to-[var(--brand-accent)]',
        description: 'Training videos, manuals, onboarding docs'
    },
    custom: {
        label: 'Custom',
        icon: File,
        color: colors.zinc500, // zinc-500
        gradient: 'from-zinc-500 to-gray-600',
        description: 'Other documents'
    }
};

export const connectionTypeConfig = {
    transclude: {
        label: 'Transclusion',
        color: colors.violet400, // violet-400
        style: 'solid',
        width: 3,
        description: 'Content is live-referenced'
    },
    reference: {
        label: 'Reference',
        color: colors.blue500, // blue-500
        style: 'dashed',
        width: 2,
        description: 'Document mentions another'
    },
    dependency: {
        label: 'Dependency',
        color: 'var(--brand-accent)', // brand accent
        style: 'dotted',
        width: 2,
        description: 'Requires other doc to exist'
    },
    version: {
        label: 'Version',
        color: colors.emerald500, // emerald-500
        style: 'curved',
        width: 2,
        description: 'Links to previous version'
    },
    supersedes: {
        label: 'Supersedes',
        color: colors.red500, // red-500
        style: 'arrow',
        width: 2,
        description: 'Replaces older document'
    }
};
