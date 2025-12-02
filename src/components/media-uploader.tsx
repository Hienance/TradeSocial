"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, UploadCloud } from "lucide-react";
import type { Media } from "@/payload-types";

interface MediaUploaderProps {
  label?: string;
  value?: string | Media | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  accept?: string;
  className?: string;
  tenantSlug?: string; // used to auto-generate alt text
  allowAltEdit?: boolean; // allow custom alt text entry
}

export function MediaUploader({
  label = "Upload",
  value,
  onChange,
  disabled,
  accept = "image/*,application/pdf,application/zip",
  className,
  tenantSlug,
  allowAltEdit = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState("");

  const media: Media | null = typeof value === "object" && value && "id" in value ? (value as Media) : null;
  const previewUrl = media?.url;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const defaultAlt = allowAltEdit
      ? file.name.replace(/\.[^.]+$/, "")
      : `${tenantSlug || 'media'}-${Date.now()}`;
    setAlt(defaultAlt);

    try {
      const form = new FormData();
      form.append("file", file);
      // Payload expects nested field under data[alt]
      form.append("data[alt]", defaultAlt);

      // Next.js route lives at src/app/(payload)/api/[...slug], which maps to /api/*
      const res = await fetch("/api/media", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try {
          const err = await res.json();
          if (err?.errors?.[0]?.message) msg = err.errors[0].message;
        } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      const newId = json?.doc?.id || json?.id || null;
      onChange(newId);
      if (!newId) {
        toast.warning("Uploaded but no ID returned");
      } else {
        toast.success("File uploaded");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="font-medium text-sm">{label}</Label>}
      {previewUrl ? (
        <div className="relative w-40 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
          <Image src={previewUrl} alt={media?.alt || alt || "Preview"} fill className="object-cover" />
          <button
            type="button"
            onClick={remove}
            className="absolute top-1 right-1 bg-black/60 text-white rounded p-1"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Input
            type="file"
            accept={accept}
            disabled={disabled || uploading}
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" disabled className="gap-2">
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Choose File"}
          </Button>
        </div>
      )}
      {allowAltEdit && !uploading && (
        <div className="space-y-1">
          <Label className="text-xs">Alt Text</Label>
          <Input
            value={alt}
            disabled={uploading || disabled}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image for accessibility"
          />
        </div>
      )}
      {media && (
        <p className="text-xs text-muted-foreground truncate">{media.filename}</p>
      )}
    </div>
  );
}

export default MediaUploader;
