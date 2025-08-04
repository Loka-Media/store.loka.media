/* eslint-disable @typescript-eslint/no-explicit-any */
// components/canvas/steps/UploadStep.jsx
"use client";

import { useState } from "react";
import { Upload, Palette, AlertCircle, Loader2 } from "lucide-react";
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
  printfulAPI: {
    uploadFile: (data: {
      filename: string;
      url: string;
      type: string;
    }) => Promise<any>;
  };
}

interface FileUploadZoneProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

interface URLUploadSectionProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onAddFromUrl: () => void;
  addingFromUrl: boolean;
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

const URLUploadSection: React.FC<URLUploadSectionProps> = ({
  imageUrl,
  setImageUrl,
  onAddFromUrl,
  addingFromUrl,
}) => {
  return (
    <div className="mb-6">
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Or add image from URL
        </h4>
        <div className="flex space-x-3">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            disabled={addingFromUrl}
          />
          <button
            onClick={onAddFromUrl}
            disabled={addingFromUrl || !imageUrl.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {addingFromUrl ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Image"
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter a direct link to an image (JPG, PNG, etc.) that&apos;s publicly
          accessible
        </p>
      </div>
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

const DemoNotices: React.FC = () => {
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Demo Mode Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>This is a demo implementation. In production, you should:</p>
              <ul className="mt-1 ml-4 list-disc">
                <li>
                  Upload files to your own cloud storage (AWS S3, Cloudinary,
                  etc.)
                </li>
                <li>Provide actual image URLs to Printful</li>
                <li>Implement proper file validation and processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Example Image URLs for Testing
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>You can test with these example URLs:</p>
              <ul className="mt-1 ml-4 list-disc font-mono text-xs">
                <li>https://picsum.photos/800/800?random=1</li>
                <li>
                  https://via.placeholder.com/800x800/FF6B6B/FFFFFF?text=Design
                </li>
                <li>
                  https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop
                </li>
              </ul>
            </div>
          </div>
        </div>
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
  const [imageUrl, setImageUrl] = useState<string>("");
  const [addingFromUrl, setAddingFromUrl] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Demo: Using a public image hosting service
        const demoImageUrl = `https://picsum.photos/800/800?random=${Date.now()}`;

        console.log("Uploading file:", file.name, "with URL:", demoImageUrl);

        // Upload to Printful through backend
        const printfulResponse = await printfulAPI.uploadFile({
          filename: file.name,
          url: demoImageUrl,
          type: "default",
        });

        console.log("Printful response:", printfulResponse);

        if (printfulResponse.result || printfulResponse.note) {
          const newFile: UploadedFile = {
            id: printfulResponse.result?.id || Date.now() + Math.random(),
            filename: file.name,
            file_url: printfulResponse.result?.url || demoImageUrl,
            thumbnail_url:
              printfulResponse.result?.thumbnail_url || demoImageUrl,
            printful_file_id: printfulResponse.result?.id,
            upload_status: "completed",
            created_at: new Date().toISOString(),
          };

          setUploadedFiles((prev) => [...prev, newFile]);

          if (printfulResponse.note) {
            toast.success(`${file.name} uploaded (Demo mode)`);
          } else {
            toast.success(`Uploaded ${file.name} to Printful`);
          }
        } else {
          throw new Error("No result from upload");
        }
      }

      // Move to design step after successful upload
      if (files.length > 0) {
        setTimeout(() => onNextStep(), 1000);
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

  const handleAddFromUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }

    setAddingFromUrl(true);

    try {
      // Validate URL format
      const url = new URL(imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Please use HTTP or HTTPS URLs only");
      }

      console.log("Adding image from URL:", imageUrl);

      // Generate a filename from the URL
      const filename =
        url.pathname.split("/").pop() || `image_${Date.now()}.jpg`;

      const uploadData = {
        filename: filename,
        url: imageUrl,
        type: "default",
      };

      console.log("Sending upload data:", uploadData);

      // Upload to Printful through backend
      const printfulResponse = await printfulAPI.uploadFile(uploadData);

      console.log("Printful response:", printfulResponse);

      if (printfulResponse.result || printfulResponse.note) {
        const newFile: UploadedFile = {
          id: printfulResponse.result?.id || Date.now() + Math.random(),
          filename: filename,
          file_url: printfulResponse.result?.url || imageUrl,
          thumbnail_url: printfulResponse.result?.thumbnail_url || imageUrl,
          printful_file_id: printfulResponse.result?.id,
          upload_status: "completed",
          created_at: new Date().toISOString(),
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        setImageUrl(""); // Clear the input

        if (printfulResponse.note) {
          toast.success(`Image added from URL (Demo mode)`);
        } else {
          toast.success(`Added image from URL to Printful`);
        }

        // Move to design step if this is the first file
        if (uploadedFiles.length === 0) {
          setTimeout(() => onNextStep(), 1000);
        }
      } else {
        throw new Error("No result from upload");
      }
    } catch (error) {
      console.error("Failed to add image from URL:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add image from URL";
      toast.error(errorMessage);
    } finally {
      setAddingFromUrl(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Upload Design Files
      </h3>

      <FileUploadZone onFileUpload={handleFileUpload} uploading={uploading} />

      <URLUploadSection
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        onAddFromUrl={handleAddFromUrl}
        addingFromUrl={addingFromUrl}
      />

      <UploadedFilesList
        uploadedFiles={uploadedFiles}
        onContinue={onNextStep}
      />

      <DemoNotices />
    </div>
  );
};

export default UploadStep;
