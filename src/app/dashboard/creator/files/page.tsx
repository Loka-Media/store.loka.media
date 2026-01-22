'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import CreativeLoader from '@/components/CreativeLoader';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  const hasFetchedRef = useRef(false);

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

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    fetchFiles();
  }, [user, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        try {
          // Use uploadFileDirectly which handles multipart/form-data upload
          const response = await printfulAPI.uploadFileDirectly(file);
          if (response.result) {
            toast.success(`Uploaded ${file.name}`);
            return response.result;
          } else {
            toast.error(`Failed to upload ${file.name}`);
            return null;
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(Boolean);

      if (successfulUploads.length > 0) {
        setFiles(prev => [...successfulUploads, ...prev]);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Call the delete API endpoint
      await printfulAPI.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-8 gap-4 sm:gap-0">
            <div className="flex-1">
              <Link
                href="/dashboard/creator"
                className="inline-flex items-center px-3 sm:px-6 py-1.5 sm:py-3 text-white/70 hover:text-white border border-white/20 rounded-lg font-bold hover:bg-white/5 transition-all text-xs sm:text-sm gap-2 mb-3 sm:mb-4"
              >
                <ArrowLeft className="w-3 h-3 sm:w-5 sm:h-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
                  Design Files
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400 font-medium">
                  Manage your uploaded design files
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <label className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm gap-1 sm:gap-2 whitespace-nowrap">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Uploading...</span>
                    <span className="sm:hidden">Upload</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Upload Files</span>
                    <span className="sm:hidden">Upload</span>
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
          </div>
        </div>

        {/* Files Display */}
        {loading ? (
          <CreativeLoader variant="product" message="Loading files..." />
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
                    File
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                    Size
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
  onDelete
}: {
  file: UploadedFile;
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
    <div className="gradient-border-white-top p-4 transition-all bg-white/5 hover:bg-white/10">

      {file.mime_type?.startsWith('image/') && file.url ? (
        <div className="relative aspect-square w-full bg-white/10 rounded-lg overflow-hidden mb-4 border border-white/10 group">
          <Image
            src={file.thumbnail_url || file.url}
            alt={file.filename}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
            priority={false}
          />
          {/* Overlay with buttons - always visible on mobile, hover on desktop */}
          <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="View file"
            >
              <Eye className="w-5 h-5 text-white" />
            </a>
            <button
              onClick={onDelete}
              className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
              title="Delete file"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-square flex flex-col items-center justify-center bg-white/10 rounded-lg mb-4 border border-white/10 group">
          <div className="mb-3">
            {getFileIcon(file)}
          </div>
          <p className="text-xs text-white/70 text-center px-2">
            {file.type || 'File'}
          </p>
          {/* Overlay with buttons for non-image files - always visible on mobile, hover on desktop */}
          <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="View file"
            >
              <Eye className="w-5 h-5 text-white" />
            </a>
            <button
              onClick={onDelete}
              className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
              title="Delete file"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs sm:text-sm font-medium text-white truncate" title={file.filename}>
        {file.filename}
      </p>
      <p className="text-xs text-white/60 mt-1">
        {formatFileSize(file.size)}
      </p>
    </div>
  );
}

function FileListItem({
  file,
  onDelete
}: {
  file: UploadedFile;
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
    <tr>
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