import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, Code, Loader } from 'lucide-react';
import { intelligentAnalyzer } from '../../services/brand/intelligentAnalyzer';
import { deploymentOrchestrator } from '../../services/brand/deploymentOrchestrator';
import { SystemAdaptation } from '../../services/brand/brandStandardsAIService';
import { BrandDocument } from '../../types';
import { brandDocumentService } from '../../services/brand/brandDocumentService';

interface BrandUploadModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const BrandUploadModal: React.FC<BrandUploadModalProps> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [adaptations, setAdaptations] = useState<SystemAdaptation[]>([]);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setAdaptations([]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setAnalyzing(true);
        setError('');

        try {
            // Create temporary document object
            const tempDoc: BrandDocument = {
                id: `temp_${Date.now()}`,
                category: 'guideline',
                title: file.name,
                description: 'Uploaded for analysis',
                fileUrl: URL.createObjectURL(file),
                fileType: file.type.includes('pdf') ? 'pdf' : 'image',
                version: '1.0',
                uploadedBy: 'current_user',
                uploadedAt: new Date().toISOString(),
                status: 'pending_review',
                metadata: {}
            };

            // Analyze document with intelligent analyzer
            console.log('[Brand Upload] Analyzing document:', file.name);
            const analysis = await intelligentAnalyzer.analyzeDocument(tempDoc, file);

            console.log('[Brand Upload] Analysis complete:', analysis);
            setAdaptations(analysis.proposedAdaptations);

        } catch (err: any) {
            console.error('[Brand Upload] Analysis error:', err);
            setError(err.message || 'Failed to analyze document. Please check your API key in .env');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDeploy = async () => {
        if (adaptations.length === 0) return;

        setDeploying(true);
        setError('');

        try {
            console.log('[Brand Upload] Deploying adaptations:', adaptations);

            const result = await deploymentOrchestrator.deploy(adaptations, {
                dryRun: false,
                autoRollback: true,
                skipTests: true
            });

            if (result.success) {
                // Add document to service
                if (file) {
                    const newDoc: BrandDocument = {
                        id: `doc_${Date.now()}`,
                        category: file.type.includes('pdf') ? 'guideline' : 'asset',
                        title: file.name,
                        description: 'Uploaded via Brand Standards',
                        fileUrl: URL.createObjectURL(file),
                        fileType: file.type.includes('pdf') ? 'pdf' : 'image',
                        version: '1.0',
                        uploadedBy: 'current_user',
                        uploadedAt: new Date().toISOString(),
                        status: 'approved',
                        metadata: {},
                        tags: ['uploaded', 'auto-generated']
                    };
                    brandDocumentService.addDocument(newDoc);
                }

                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setError(`Deployment failed: ${result.errors?.join(', ')}`);
            }

        } catch (err: any) {
            console.error('[Brand Upload] Deployment error:', err);
            setError(err.message || 'Failed to deploy changes');
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg">
                            <Upload className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Upload Brand Document</h2>
                            <p className="text-sm text-zinc-500 mt-1">AI will analyze and generate system adaptations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Select PDF or Image
                        </label>
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileSelect}
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg
                       text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg
                       file:border-0 file:bg-violet-600 file:text-white file:cursor-pointer
                       hover:border-violet-500/50 transition"
                        />
                        {file && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                                <FileText className="w-4 h-4" />
                                <span>{file.name}</span>
                                <span className="text-zinc-600">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>

                    {/* Analyze Button */}
                    {file && !adaptations.length && (
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3
                       bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800
                       text-white rounded-lg transition font-medium"
                        >
                            {analyzing ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Analyze Document
                                </>
                            )}
                        </button>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-400">Analysis Error</p>
                                <p className="text-sm text-red-400/80 mt-1">{error}</p>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Make sure you've set VITE_AI_PROVIDER and VITE_OPENAI_API_KEY in your .env file
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Adaptations Preview */}
                    {adaptations.length > 0 && !success && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-semibold text-white">Proposed System Adaptations</h3>
                                <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                                    {adaptations.length} changes
                                </span>
                            </div>

                            <div className="space-y-2">
                                {adaptations.map((adaptation, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">
                                                        {adaptation.type}
                                                    </span>
                                                    <span className="text-xs text-zinc-600">{adaptation.targetFile}</span>
                                                </div>
                                                <p className="text-sm text-zinc-300">{adaptation.description}</p>
                                                {adaptation.reasoning && (
                                                    <p className="text-xs text-zinc-500 mt-2">💡 {adaptation.reasoning}</p>
                                                )}
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${adaptation.confidence > 0.8 ? 'bg-emerald-500/10 text-emerald-500' :
                                                adaptation.confidence > 0.6 ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {Math.round(adaptation.confidence * 100)}% confident
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Deploy Button */}
                            <button
                                onClick={handleDeploy}
                                disabled={deploying}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3
                         bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800
                         text-white rounded-lg transition font-medium"
                            >
                                {deploying ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Deploying Changes...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Approve & Deploy
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-emerald-400">Deployment Successful!</h3>
                            <p className="text-sm text-zinc-400 mt-2">
                                Brand standards updated. All modules will adapt automatically.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandUploadModal;
