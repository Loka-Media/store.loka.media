/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Upload, Palette, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// Interfaces for better type safety
interface UploadedFile {
  id: string | number;
  filename: string;
  file_url: string;
  thumbnail_url: string;
  printful_file_id: number;
  upload_status: "pending" | "completed" | "failed";
  created_at: string;
}

interface UploadStepProps {
  uploadedFiles: UploadedFile[];
  uploading: boolean;
  setUploading: (isUploading: boolean) => void;
  setUploadedFiles: (updater: (prev: UploadedFile[]) => UploadedFile[]) => void;
  onNextStep: () => void;
  printfulAPI: any;
}

interface FileUploadZoneProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

interface UploadedFilesListProps {
  uploadedFiles: UploadedFile[];
  onContinue: () => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  uploading,
}) => {
  return (
    <div className="mb-6">
      <label className="block">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
          {uploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="mt-4">
            <p className="text-lg text-gray-600">
              {uploading
                ? "Uploading..."
                : "Drop your design files here or click to browse"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, PDF up to 10MB each • Recommended: 300 DPI, RGB color
              mode
            </p>
          </div>
        </div>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf,.ai,.psd,.eps"
          onChange={onFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
};

const UploadedFilesList: React.FC<UploadedFilesListProps> = ({
  uploadedFiles,
  onContinue,
}) => {
  if (uploadedFiles.length === 0) return null;

  return (
    <div>
      <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Files</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {uploadedFiles.map((file) => (
          <div key={file.id} className="group relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {file.thumbnail_url ? (
                <Image
                  src={file.thumbnail_url}
                  alt={file.filename}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Palette className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-600 truncate">
              {file.filename}
            </p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                ✓
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onContinue}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Continue to Design
        </button>
      </div>
    </div>
  );
};

const UploadStep: React.FC<UploadStepProps> = ({
  uploadedFiles,
  uploading,
  setUploading,
  setUploadedFiles,
  onNextStep,
  printfulAPI,
}) => {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        console.log("Uploading file:", file.name, "to DigitalOcean");

        // Upload directly to DigitalOcean via our backend
        const uploadResponse = await printfulAPI.uploadFileDirectly(file);

        console.log("Upload response:", uploadResponse);

        if (uploadResponse?.result) {
          const newFile: UploadedFile = {
            id: uploadResponse.result.id || Date.now() + Math.random(),
            filename: uploadResponse.result.filename,
            file_url: uploadResponse.result.url,
            thumbnail_url:
              uploadResponse.result.thumbnail_url || uploadResponse.result.url,
            printful_file_id: uploadResponse.result.id,
            upload_status: "completed",
            created_at: new Date().toISOString(),
          };

          // Add to local state immediately
          setUploadedFiles((prev) => [...prev, newFile]);

          toast.success(`✅ ${file.name} uploaded successfully!`);
        } else {
          throw new Error("No result from upload");
        }
      }

      // Move to design step after successful upload
      if (files.length > 0) {
        setTimeout(() => {
          onNextStep();
          toast.success(
            "Ready to design! Your files are available in the editor."
          );
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to upload files:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload files";
      toast.error(`Failed to upload files: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Upload Design Files
      </h3>

      <FileUploadZone onFileUpload={handleFileUpload} uploading={uploading} />

      <UploadedFilesList
        uploadedFiles={uploadedFiles}
        onContinue={onNextStep}
      />
    </div>
  );
};

export default UploadStep;
