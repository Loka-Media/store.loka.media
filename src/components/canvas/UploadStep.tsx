/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Upload, Palette, Loader2, CheckCircle } from "lucide-react";
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
    <div className="mb-8">
      <label className="block">
        <div className="border-2 border-dashed border-gray-800 rounded-2xl p-12 text-center hover:border-orange-500 transition-all duration-300 cursor-pointer bg-black/60 hover:bg-black/80 backdrop-blur-sm transform hover:scale-[1.01] hover:shadow-2xl hover:shadow-orange-500/10">
          {uploading ? (
            <div className="animate-bounce">
              <Loader2 className="mx-auto h-14 w-14 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="animate-pulse hover:animate-none transition-all duration-300">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          <div className="mt-8">
            <p className="text-2xl font-bold text-white">
              {uploading
                ? "Uploading your design..."
                : "Drop your design files here or click to browse"}
            </p>
            <p className="text-sm text-gray-400 mt-4 font-medium">
              PNG, JPG, PDF up to 10MB each • Recommended: 300 DPI, RGB color mode
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
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-orange-500" />
        <h4 className="text-lg font-bold text-black">Uploaded Files</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {uploadedFiles.map((file, index) => (
          <div 
            key={file.id} 
            className="group relative animate-slideInUp transform hover:scale-105 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="aspect-square bg-black/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-800 hover:border-orange-500/30">
              {file.thumbnail_url ? (
                <Image
                  src={file.thumbnail_url}
                  alt={file.filename}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-white truncate">
              {file.filename}
            </p>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/25"
        >
          <span className="mr-3">Continue to Design</span>
          <div className="transform group-hover:translate-x-1 transition-transform duration-300">→</div>
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
    <div className="bg-black/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-gray-800 animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
            <Upload className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            Upload Design Files
          </h3>
        </div>
        <p className="text-gray-400 font-medium text-lg">
          Start by uploading your creative designs to bring your product to life
        </p>
      </div>

      <FileUploadZone onFileUpload={handleFileUpload} uploading={uploading} />

      <UploadedFilesList
        uploadedFiles={uploadedFiles}
        onContinue={onNextStep}
      />
    </div>
  );
};

export default UploadStep;
