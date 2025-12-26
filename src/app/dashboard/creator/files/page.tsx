'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI } from '@/lib/api';
import {
  Upload,
  ArrowLeft,
  Download,
  Trash2,
  Eye,
  File,
  Image as ImageIcon,
  FileText,
  Search,
  Grid,
  List
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import GradientTitle from '@/components/ui/GradientTitle';

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  thumbnail_url: string;
  type: string;
  file_size: number;
  size: number;
  status: string;
  created: number;
  mime_type?: string;
  dpi?: number;
  width?: number;
  height?: number;
  storage_key?: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerImage, setViewerImage] = useState<UploadedFile | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'ai': 'application/postscript',
      'psd': 'image/vnd.adobe.photoshop',
      'eps': 'application/postscript'
    };
    return mimeMap[ext] || 'application/octet-stream';
  };

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await printfulAPI.getFiles();
      const processedFiles = (response.result || []).map((file: any) => ({
        ...file,
        size: file.file_size,
        status: 'ok',
        mime_type: getMimeType(file.filename)
      }));
      setFiles(processedFiles);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      return;
    }
    
    fetchFiles();
  }, [user, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        // You may need to upload the file to your own server or a storage service first to get a URL
        // For demo purposes, we'll use a placeholder URL
        const demoImageUrl = URL.createObjectURL(file);

        try {
          const response = await printfulAPI.uploadFile({
            filename: file.name,
            url: demoImageUrl,
            type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : undefined
          });
          if (response.result) {
            toast.success(`Uploaded ${file.name}`);
            return response.result;
          }
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          throw error;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...uploadedFiles.filter(Boolean), ...prev]);
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Note: Printful API doesn't have a delete endpoint, so we'll just remove from UI
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File removed from list');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Delete ${selectedFiles.length} selected files?`)) return;

    try {
      setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
      toast.success(`Removed ${selectedFiles.length} files`);
    } catch (error) {
      console.error('Failed to delete files:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleSelectFile = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length 
        ? [] 
        : filteredFiles.map(f => f.id)
    );
  };


  const filteredFiles = files.filter(file => {
    const matchesSearch = !filters.search || 
      file.filename.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = !filters.type || file.mime_type?.includes(filters.type);
    const matchesStatus = !filters.status || file.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div>
              <Link
                href="/dashboard/creator"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-white/70 hover:text-white border border-white/20 rounded-lg font-bold hover:bg-white/5 transition-all text-xs sm:text-sm gap-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Dashboard</span>
              </Link>
              <GradientTitle text="Design Files" size="lg" />
              <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
                Manage your uploaded design files
              </p>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Delete ({selectedFiles.length})</span>
                </button>
              )}

              <label className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm gap-2">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Upload Files</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.svg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="gradient-border-white-top p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
                  placeholder="Search files..."
                />
                <Search className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
              </div>

              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
              >
                <option value="" className="bg-gray-900">All Types</option>
                <option value="image" className="bg-gray-900">Images</option>
                <option value="pdf" className="bg-gray-900">PDF</option>
                <option value="svg" className="bg-gray-900">SVG</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
              >
                <option value="" className="bg-gray-900">All Status</option>
                <option value="ok" className="bg-gray-900">Ready</option>
                <option value="processing" className="bg-gray-900">Processing</option>
                <option value="failed" className="bg-gray-900">Failed</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Select All */}
              <button
                onClick={handleSelectAll}
                className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 border border-white/20 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition-all"
              >
                {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0
                  ? 'Deselect All'
                  : 'Select All'
                }
              </button>

              {/* View Mode */}
              <div className="flex border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-3 transition-all font-bold text-sm ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-3 transition-all font-bold text-sm ${viewMode === 'list' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs sm:text-sm font-bold text-white/80 bg-white/5 border border-white/20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 inline-block">
            {filteredFiles.length} files found
            {selectedFiles.length > 0 && <span className="text-orange-400"> • {selectedFiles.length} selected</span>}
          </div>
        </div>

        {/* Files Display */}
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 inline-block mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
            </div>
            <p className="mt-4 text-white font-bold text-lg">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 gradient-border-white-top p-6 sm:p-8">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-6 inline-block mb-6">
              <Upload className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No files found</h3>
            <p className="text-base sm:text-lg text-white/70 font-medium mb-8">
              {filters.search || filters.type || filters.status
                ? 'Try adjusting your filters'
                : 'Upload your first design file to get started'
              }
            </p>
            {!filters.search && !filters.type && !filters.status && (
              <div className="mt-6">
                <label className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-sm sm:text-base gap-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Upload Your First File</span>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.svg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <FileGridItem
                key={file.id}
                file={file}
                isSelected={selectedFiles.includes(file.id)}
                onSelect={() => handleSelectFile(file.id)}
                onDelete={() => handleDeleteFile(file.id)}
              />
            ))}
          </div>
        ) : (
          <div className="gradient-border-white-top overflow-hidden">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredFiles.map((file) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    isSelected={selectedFiles.includes(file.id)}
                    onSelect={() => handleSelectFile(file.id)}
                    onDelete={() => handleDeleteFile(file.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FileGridItem({
  file,
  isSelected,
  onSelect,
  onDelete
}: {
  file: UploadedFile;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const getFileIcon = (file: UploadedFile) => {
    if (file.mime_type?.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-400" />;
    } else if (file.mime_type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    }
    return <File className="w-8 h-8 text-white/60" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`gradient-border-white-top p-4 transition-all ${
      isSelected ? 'bg-white/10' : 'bg-white/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
        <div className="flex space-x-2">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-white/50 hover:text-white/80 transition-colors"
            title="View file"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={onDelete}
            className="p-1.5 text-white/50 hover:text-red-400 transition-colors"
            title="Delete file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {file.mime_type?.startsWith('image/') && file.url ? (
        <div className="relative aspect-square w-full bg-white/10 rounded-lg overflow-hidden mb-4 border border-white/10">
          <Image
            src={file.thumbnail_url || file.url}
            alt={file.filename}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
            priority={false}
          />
        </div>
      ) : (
        <div className="aspect-square flex flex-col items-center justify-center bg-white/10 rounded-lg mb-4 border border-white/10">
          <div className="mb-3">
            {getFileIcon(file)}
          </div>
          <p className="text-xs text-white/70 text-center px-2">
            {file.type || 'File'}
          </p>
        </div>
      )}

      <p className="text-xs sm:text-sm font-medium text-white truncate" title={file.filename}>
        {file.filename}
      </p>
      <p className="text-xs text-white/60 mt-1">
        {formatFileSize(file.size)}
      </p>
      <span className={`inline-block mt-3 px-2 py-1 text-xs font-bold rounded-full ${
        file.status === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
        file.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
        'bg-red-500/20 text-red-400 border border-red-500/50'
      }`}>
        {file.status}
      </span>
    </div>
  );
}

function FileListItem({
  file,
  isSelected,
  onSelect,
  onDelete
}: {
  file: UploadedFile;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const getFileIcon = (file: UploadedFile) => {
    if (file.mime_type?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />;
    } else if (file.mime_type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    return <File className="w-5 h-5 text-white/60" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <tr className={isSelected ? 'bg-white/5' : ''}>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {file.mime_type?.startsWith('image/') ? (
              <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-white/20">
                <Image
                  src={file.thumbnail_url || file.url}
                  alt={file.filename}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-lg border border-white/20">
                {getFileIcon(file)}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-xs sm:text-sm font-medium text-white">{file.filename}</div>
            {file.width && file.height && (
              <div className="text-xs sm:text-sm text-white/60">{file.width} × {file.height}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/70">
        {file.mime_type}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/70">
        {formatFileSize(file.size)}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
          file.status === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
          file.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
          'bg-red-500/20 text-red-400 border border-red-500/50'
        }`}>
          {file.status}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/70">
        {formatDate(file.created)}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-3">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </a>
          <a
            href={file.url}
            download={file.filename}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onDelete}
            className="text-white/50 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}