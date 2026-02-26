/**
 * Document Graph Demo Data
 * 
 * Seed data to demonstrate the visual document graph
 */

import { documentGraphService } from './documentGraphService';

export const seedDocumentGraph = () => {
    console.log('[SeedData] Populating document graph with demo data...');

    // 1. Brand Guidelines (Master Document)
    const brandGuide = documentGraphService.addDocument({
        type: 'brand_asset',
        title: 'Singularity Brand Guidelines 2024',
        description: 'Master brand document defining visual identity, tone of voice, and brand standards across all properties.',
        content: 'Brand guidelines content...',
        metadata: {
            size: 2048000,
            format: 'PDF',
            uploadedBy: 'Brand Director',
            uploadedAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            version: 3,
            tags: ['brand', 'corporate', '2024', 'design'],
            department: 'Brand Management',
            properties: ['All Properties']
        },
        position: { x: 600, y: 300 }
    });

    // 2. Color Palette
    const colorPalette = documentGraphService.addDocument({
        type: 'brand_asset',
        title: 'Color Palette Master',
        description: 'Official color codes and usage guidelines for all brand touchpoints.',
        content: 'Primary: #1a1f3d, Secondary: #a78bfa...',
        metadata: {
            size: 512000,
            format: 'PDF',
            uploadedBy: 'Design Lead',
            uploadedAt: '2024-01-10T14:30:00Z',
            updatedAt: '2024-01-20T09:15:00Z',
            version: 2,
            tags: ['design', 'colors', 'brand'],
            department: 'Brand Management',
            properties: ['All Properties']
        },
        position: { x: 400, y: 200 }
    });

    // 3. NYC Property Handbook
    const nycHandbook = documentGraphService.addDocument({
        type: 'sop',
        title: 'NYC Property Handbook',
        description: 'Complete operations manual for New York City location.',
        content: 'NYC handbook content...',
        metadata: {
            size: 3072000,
            format: 'PDF',
            uploadedBy: 'NYC GM',
            uploadedAt: '2024-02-01T08:00:00Z',
            updatedAt: '2024-02-01T08:00:00Z',
            version: 1,
            tags: ['nyc', 'operations', 'handbook'],
            department: 'Operations',
            properties: ['NYC']
        },
        position: { x: 800, y: 200 }
    });

    // 4. Fire Safety Certificate
    const fireCert = documentGraphService.addDocument({
        type: 'certificate',
        title: 'NYC Fire Safety Certificate',
        description: 'Annual fire safety inspection certificate for NYC property.',
        fileUrl: '/docs/fire-cert-nyc-2024.pdf',
        metadata: {
            size: 256000,
            format: 'PDF',
            uploadedBy: 'Safety Officer',
            uploadedAt: '2024-01-05T12:00:00Z',
            updatedAt: '2024-01-05T12:00:00Z',
            version: 1,
            tags: ['certificate', 'fire', 'safety', 'nyc'],
            department: 'Operations',
            properties: ['NYC']
        },
        position: { x: 1000, y: 300 }
    });

    // 5. Check-in SOP
    const checkinSOP = documentGraphService.addDocument({
        type: 'sop',
        title: 'Guest Check-in Procedure',
        description: 'Standard operating procedure for guest check-in process.',
        content: 'Check-in SOP content...',
        metadata: {
            size: 512000,
            format: 'PDF',
            uploadedBy: 'Front Desk Manager',
            uploadedAt: '2024-01-20T10:00:00Z',
            updatedAt: '2024-01-25T14:30:00Z',
            version: 2,
            tags: ['front-desk', 'check-in', 'sop'],
            department: 'Front Desk',
            properties: ['All Properties']
        },
        position: { x: 600, y: 500 }
    });

    // 6. Emergency Evacuation Plan
    const emergencySOS = documentGraphService.addDocument({
        type: 'sos',
        title: 'Emergency Evacuation Plan',
        description: 'Emergency protocols and evacuation routes for all properties.',
        content: 'Emergency plan content...',
        metadata: {
            size: 1024000,
            format: 'PDF',
            uploadedBy: 'Safety Director',
            uploadedAt: '2024-01-03T09:00:00Z',
            updatedAt: '2024-01-03T09:00:00Z',
            version: 1,
            tags: ['emergency', 'safety', 'evacuation'],
            department: 'Operations',
            properties: ['All Properties']
        },
        position: { x: 1000, y: 500 }
    });

    // 7. Staff Training Manual
    const trainingManual = documentGraphService.addDocument({
        type: 'training',
        title: 'New Employee Training Manual',
        description: 'Comprehensive training manual for new hires.',
        content: 'Training manual content...',
        metadata: {
            size: 2560000,
            format: 'PDF',
            uploadedBy: 'HR Director',
            uploadedAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-02-01T10:00:00Z',
            version: 3,
            tags: ['training', 'hr', 'onboarding'],
            department: 'HR',
            properties: ['All Properties']
        },
        position: { x: 400, y: 500 }
    });

    // 8. Vendor Agreement (imaginary)
    const vendorAgreement = documentGraphService.addDocument({
        type: 'agreement',
        title: 'Housekeeping Vendor Agreement',
        description: 'Service agreement with housekeeping supply vendor.',
        fileUrl: '/docs/vendor-agreement-2024.pdf',
        metadata: {
            size: 768000,
            format: 'PDF',
            uploadedBy: 'Procurement',
            uploadedAt: '2024-01-08T13:00:00Z',
            updatedAt: '2024-01-08T13:00:00Z',
            version: 1,
            tags: ['vendor', 'agreement', 'housekeeping'],
            department: 'Procurement',
            properties: ['All Properties']
        },
        position: { x: 200, y: 400 }
    });

    // Create Connections
    console.log('[SeedData] Creating document connections...');

    // Brand Guide → NYC Handbook (transclusion)
    documentGraphService.addConnection({
        sourceId: brandGuide.id,
        targetId: nycHandbook.id,
        type: 'transclude',
        strength: 1,
        metadata: {
            reason: 'NYC Handbook references brand standards',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    // Color Palette → Brand Guide (reference)
    documentGraphService.addConnection({
        sourceId: colorPalette.id,
        targetId: brandGuide.id,
        type: 'reference',
        strength: 0.8,
        metadata: {
            reason: 'Brand guide includes color palette',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    // NYC Handbook → Check-in SOP (reference)
    documentGraphService.addConnection({
        sourceId: nycHandbook.id,
        targetId: checkinSOP.id,
        type: 'reference',
        strength: 0.9,
        metadata: {
            reason: 'Handbook references check-in procedures',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    // Fire Cert → Emergency SOS (dependency)
    documentGraphService.addConnection({
        sourceId: fireCert.id,
        targetId: emergencySOS.id,
        type: 'dependency',
        strength: 1,
        metadata: {
            reason: 'Emergency plan requires valid fire certificate',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    // Training Manual → Check-in SOP (reference)
    documentGraphService.addConnection({
        sourceId: trainingManual.id,
        targetId: checkinSOP.id,
        type: 'reference',
        strength: 0.7,
        metadata: {
            reason: 'Training includes check-in procedures',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    // NYC Handbook → Fire Cert (dependency)
    documentGraphService.addConnection({
        sourceId: nycHandbook.id,
        targetId: fireCert.id,
        type: 'dependency',
        strength: 0.8,
        metadata: {
            reason: 'Operations require valid certificates',
            createdAt: new Date().toISOString(),
            createdBy: 'System'
        }
    });

    console.log('[SeedData] ✅ Document graph populated!');
    console.log(`[SeedData] Documents: ${documentGraphService.getAllDocuments().length}`);
    console.log(`[SeedData] Connections: ${documentGraphService.getAllConnections().length}`);
};
