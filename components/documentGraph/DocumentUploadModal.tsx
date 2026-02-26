import React, { useState } from 'react';
import { X, Upload, FileText, Plus } from 'lucide-react';
import { documentGraphService, DocumentType } from '../../services/intelligence/documentGraphService';
import { documentTypeConfig } from '../../services/intelligence/documentGraphConfig';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<DocumentType>('brand_asset');
    const [tags, setTags] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [properties, setProperties] = useState<string[]>(['All Properties']);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        if (!title) {
            // Auto-fill title from filename
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleSubmit = () => {
        if (!title || !description) {
            alert('Please fill in all required fields');
            return;
        }

        // Create document
        const newDoc = documentGraphService.addDocument({
            type,
            title,
            description,
            fileUrl: file ? URL.createObjectURL(file) : undefined,
            content: !file ? description : undefined,
            metadata: {
                size: file?.size || description.length,
                format: file?.type || 'text/plain',
                uploadedBy: 'Current User',
                uploadedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                department,
                properties
            },
            position: {
                x: 400 + Math.random() * 600,
                y: 300 + Math.random() * 400
            }
        });

        console.log('[DocumentUploadModal] Created:', newDoc.title);

        // Reset form
        setTitle('');
        setDescription('');
        setType('brand_asset');
        setTags('');
        setDepartment('Operations');
        setProperties(['All Properties']);
        setFile(null);

        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-100">Add Document to Knowledge Graph</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File Upload Zone */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragActive
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                        <p className="text-zinc-300 mb-2">
                            {file ? file.name : 'Drop files here or click to upload'}
                        </p>
                        <input
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer transition"
                        >
                            Choose File
                        </label>
                    </div>

                    <div className="text-center text-zinc-500">OR</div>

                    {/* Document Type */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Document Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as DocumentType)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-violet-500"
                        >
                            {Object.entries(documentTypeConfig).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {config.label} - {config.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Brand Guidelines 2024"
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this document..."
                            rows={3}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., design, corporate, 2024"
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Department
                        </label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-violet-500"
                        >
                            <option>Brand Management</option>
                            <option>Operations</option>
                            <option>HR</option>
                            <option>Finance</option>
                            <option>IT</option>
                            <option>Marketing</option>
                        </select>
                    </div>

                    {/* Properties */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Properties
                        </label>
                        <div className="space-y-2">
                            {['All Properties', 'NYC', 'Dubai', 'Singapore', 'London'].map(prop => (
                                <label key={prop} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={properties.includes(prop)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setProperties([...properties, prop]);
                                            } else {
                                                setProperties(properties.filter(p => p !== prop));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500"
                                    />
                                    <span className="text-sm text-zinc-300">{prop}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add to Graph
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadModal;
