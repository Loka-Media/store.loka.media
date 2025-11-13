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

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  thumbnail_url: string;
  type: string;
  size: number;
  status: string;
  created: number;
  mime_type: string;
  dpi?: number;
  width?: number;
  height?: number;
}

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await printfulAPI.getFiles();
      setFiles(response.result || []);
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-200 to-purple-200 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard/creator"
                className="inline-flex items-center px-4 py-2 bg-white border-4 border-black rounded-xl font-extrabold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <FileImage className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Design Files</h1>
                  <p className="mt-1 text-base font-bold text-gray-800">
                    Manage your uploaded design files
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 border-4 border-black text-white font-extrabold rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedFiles.length})
                </button>
              )}

              <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-400 border-4 border-black text-white font-extrabold rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
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
        <div className="bg-white border-4 border-black rounded-2xl p-6 mb-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-yellow-50 border-4 border-black rounded-xl text-black placeholder-gray-600 focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all font-bold"
                  placeholder="Search files..."
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-black" />
              </div>

              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-3 bg-yellow-50 border-4 border-black rounded-xl text-black focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all font-bold"
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDF</option>
                <option value="svg">SVG</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 bg-yellow-50 border-4 border-black rounded-xl text-black focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all font-bold"
              >
                <option value="">All Status</option>
                <option value="ok">Ready</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              {/* Select All */}
              <button
                onClick={handleSelectAll}
                className="text-sm font-extrabold px-4 py-2 bg-blue-200 border-2 border-black text-black rounded-xl hover:bg-blue-300 transition-all"
              >
                {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0
                  ? 'Deselect All'
                  : 'Select All'
                }
              </button>

              {/* View Mode */}
              <div className="flex border-4 border-black rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all font-extrabold ${viewMode === 'grid' ? 'bg-purple-300 text-black' : 'bg-white text-black hover:bg-yellow-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all font-extrabold ${viewMode === 'list' ? 'bg-purple-300 text-black' : 'bg-white text-black hover:bg-yellow-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm font-extrabold text-black bg-gradient-to-r from-green-200 to-blue-200 border-2 border-black rounded-lg px-3 py-2 inline-block">
            {filteredFiles.length} files found
            {selectedFiles.length > 0 && <span className="text-purple-600"> • {selectedFiles.length} selected</span>}
          </div>
        </div>

        {/* Files Display */}
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 border-4 border-black rounded-full p-4 inline-block mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
            </div>
            <p className="mt-4 text-black font-extrabold text-lg">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <div className="bg-gradient-to-br from-blue-300 to-purple-400 border-4 border-black rounded-2xl p-6 inline-block mb-6">
              <Upload className="mx-auto h-16 w-16 text-black" />
            </div>
            <h3 className="text-2xl font-extrabold text-black mb-2">No files found</h3>
            <p className="text-lg font-bold text-gray-700 mb-6">
              {filters.search || filters.type || filters.status
                ? 'Try adjusting your filters'
                : 'Upload your first design file to get started'
              }
            </p>
            {!filters.search && !filters.type && !filters.status && (
              <div className="mt-6">
                <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg cursor-pointer">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your First File
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    } else if (file.mime_type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
      isSelected ? 'border-indigo-500' : 'border-gray-200'
    } hover:border-gray-300`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded"
          />
          <div className="flex space-x-1">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-600"
              title="View file"
            >
              <Eye className="w-4 h-4" />
            </a>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          {file.mime_type?.startsWith('image/') && file.thumbnail_url ? (
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-3">
              <Image
                src={file.thumbnail_url}
                alt={file.filename}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg mb-3">
              {getFileIcon(file)}
            </div>
          )}

          <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
            {file.filename}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
            file.status === 'ok' ? 'bg-green-100 text-green-800' :
            file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {file.status}
          </span>
        </div>
      </div>
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
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (file.mime_type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
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
    <tr className={isSelected ? 'bg-indigo-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {file.mime_type?.startsWith('image/') && file.thumbnail_url ? (
              <div className="h-10 w-10 relative rounded-lg overflow-hidden">
                <Image
                  src={file.thumbnail_url}
                  alt={file.filename}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                {getFileIcon(file)}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{file.filename}</div>
            {file.width && file.height && (
              <div className="text-sm text-gray-500">{file.width} × {file.height}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {file.mime_type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(file.size)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          file.status === 'ok' ? 'bg-green-100 text-green-800' :
          file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {file.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(file.created)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Eye className="w-4 h-4" />
          </a>
          <a
            href={file.url}
            download={file.filename}
            className="text-gray-600 hover:text-gray-900"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}