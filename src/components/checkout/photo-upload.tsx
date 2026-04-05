"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  label: string;
  infoText?: string;
  onUpload: (dataUri: string) => void;
  value?: string;
  accept?: string;
}

export function PhotoUpload({
  label,
  infoText,
  onUpload,
  value,
  accept = "image/*",
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File too large. Maximum 10MB.");
        return;
      }
      setFileError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setPreview(dataUri);
        onUpload(dataUri);
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {infoText && <p className="text-xs text-gray-500">{infoText}</p>}

      {preview ? (
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-2">
          <img
            src={preview}
            alt="Upload preview"
            className="mx-auto max-h-48 rounded-lg object-contain"
          />
          <button
            onClick={handleRemove}
            className="absolute right-3 top-3 rounded-full bg-white p-1 shadow-md hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-yasmin">
            <Check className="h-3 w-3" /> Uploaded
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors",
            isDragging
              ? "border-yasmin bg-yasmin/5"
              : "border-gray-200 bg-gray-50"
          )}
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-center text-sm text-gray-500">
            Drag & drop a photo here
          </p>

          <div className="flex gap-2">
            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Upload className="mr-1 inline h-3 w-3" />
              Browse Files
            </button>

            {/* Camera button (mobile-friendly) */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Camera className="mr-1 inline h-3 w-3" />
              Take Photo
            </button>
          </div>

          {fileError ? (
            <p className="text-[10px] text-red-500">{fileError}</p>
          ) : (
            <p className="text-[10px] text-gray-400">JPG, PNG up to 10MB</p>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
