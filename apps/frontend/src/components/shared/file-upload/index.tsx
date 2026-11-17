import {
  useState,
  useRef,
  useId,
  useCallback,
  useMemo,
  type Ref,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { UploadCloud, X, Plus, FileText } from "lucide-react";
import { Badge } from "@/components/shared/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  /** Optional ref forwarded to the root container */
  ref?: Ref<HTMLDivElement>;
  /** Controlled value of uploaded files */
  value?: File[];
  /** Default files for uncontrolled usage */
  defaultValue?: File[];
  /** Callback fired when the list of files changes */
  onFilesChange?: (files: File[]) => void;
  /** Maximum number of files allowed (if 1, behaves as single file upload; defaults to 1) */
  maxFiles?: number;
  /** Regex pattern to validate file name / extension (e.g. /\.(jpg|jpeg|png|webp)$/i) */
  acceptRegex?: RegExp;
  /** Maximum allowed file size in bytes */
  maxFileSize?: number;
  /** Native accept attribute for file picker filter (e.g. ".pdf", "image/*", "application/pdf") */
  accept?: string;
  /** Explicit flag to allow multiple files (defaults to maxFiles > 1) */
  multiple?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether files are currently uploading */
  loading?: boolean;
  /** Whether a file selection is required */
  required?: boolean;
  /** Custom label displayed above the upload area */
  label?: string;
  /** Error message displayed below the dropzone */
  error?: string;
  /** Helper text displayed below the files */
  helperText?: string;
  /** Custom main text inside the dropzone */
  dropzoneTitle?: string;
  /** Custom subtitle text inside the dropzone */
  dropzoneSubtitle?: string;
  /** Additional className for the root container */
  className?: string;
  /** ID for the native input element */
  id?: string;
  /** Name attribute for the native input */
  name?: string;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${formatted} ${sizes[i]}`;
}

const globalFileUrlCache = new WeakMap<object, string>();

export function isImageFile(file: any): boolean {
  if (!file) return false;
  if (typeof file === "string") {
    return /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file);
  }
  if (typeof file.url === "string") {
    return true;
  }
  return (
    (Boolean(file.type) && file.type.startsWith("image/")) ||
    Boolean(file.name && /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name))
  );
}

export function getFilePreviewUrl(file: any): string {
  if (!file) return "";
  if (typeof file === "string") return file;
  if (typeof file.url === "string") return file.url;
  if (typeof file.preview === "string") return file.preview;

  if (
    typeof window === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return "";
  }

  if (typeof file === "object" && file !== null) {
    let url = globalFileUrlCache.get(file);
    if (!url) {
      try {
        url = URL.createObjectURL(file as Blob);
        globalFileUrlCache.set(file, url);
      } catch {
        return "";
      }
    }
    return url;
  }

  return "";
}

export function revokeFilePreviewUrl(file: any): void {
  if (typeof file === "object" && file !== null) {
    const url = globalFileUrlCache.get(file);
    if (url) {
      if (
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
      ) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore
        }
      }
      globalFileUrlCache.delete(file);
    }
  }
}

export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept || !accept.trim()) return true;

  const patterns = accept
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  if (patterns.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return fileType === pattern;
  });
}

export function FileUpload({
  ref,
  value,
  defaultValue,
  onFilesChange,
  maxFiles = 1,
  acceptRegex,
  maxFileSize,
  accept,
  multiple,
  disabled = false,
  loading = false,
  required = false,
  label,
  error,
  helperText,
  dropzoneTitle,
  dropzoneSubtitle,
  className,
  id,
  name,
}: FileUploadProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isMultiple = maxFiles > 1 || multiple === true;
  const effectiveMaxFiles = maxFiles;

  const [internalFiles, setInternalFiles] = useState<File[]>(
    defaultValue ?? []
  );
  const files = value !== undefined ? value : internalFiles;

  const getFileKey = useCallback((file: any, index: number) => {
    if (file.id) return file.id;
    return `${file.name || "file"}-${file.size || 0}-${file.lastModified || index}`;
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isMaxReached = files.length >= effectiveMaxFiles;
  const isInactive = disabled || loading || isMaxReached;

  const commitFiles = useCallback(
    (nextFiles: File[]) => {
      if (value === undefined) {
        setInternalFiles(nextFiles);
      }
      onFilesChange?.(nextFiles);
    },
    [value, onFilesChange]
  );

  const validateAndAddFiles = useCallback(
    (incomingFiles: FileList | File[]) => {
      if (disabled || loading) return;

      const incomingList = Array.from(incomingFiles);
      if (incomingList.length === 0) return;

      const newErrors: string[] = [];
      const currentCount = files.length;
      const availableSlots = effectiveMaxFiles - currentCount;

      if (availableSlots <= 0) {
        setErrors([
          `Maximum of ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} allowed.`,
        ]);
        return;
      }

      const validCandidates: File[] = [];

      incomingList.forEach((file) => {
        if (accept && !matchesAccept(file, accept)) {
          newErrors.push(`${file.name} is not a supported file type.`);
          return;
        }

        if (acceptRegex) {
          acceptRegex.lastIndex = 0;
          if (!acceptRegex.test(file.name)) {
            newErrors.push(`${file.name} is not a supported file type.`);
            return;
          }
        }

        if (maxFileSize && file.size > maxFileSize) {
          newErrors.push(
            `${file.name} exceeds the maximum file size of ${formatFileSize(maxFileSize)}.`
          );
          return;
        }

        validCandidates.push(file);
      });

      let acceptedFiles: File[];
      if (validCandidates.length > availableSlots) {
        newErrors.push(
          `Maximum of ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} allowed. Only first ${availableSlots} valid ${availableSlots === 1 ? "file was" : "files were"} added.`
        );
        acceptedFiles = validCandidates.slice(0, availableSlots);
      } else {
        acceptedFiles = validCandidates;
      }

      setErrors(newErrors);

      if (acceptedFiles.length > 0) {
        if (isMultiple) {
          commitFiles([...files, ...acceptedFiles]);
        } else {
          commitFiles(acceptedFiles.slice(0, 1));
        }
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [
      disabled,
      loading,
      files,
      effectiveMaxFiles,
      accept,
      acceptRegex,
      maxFileSize,
      isMultiple,
      commitFiles,
    ]
  );

  const handleRemove = useCallback(
    (indexToRemove: number) => {
      if (disabled || loading) return;
      const fileToRemove = files[indexToRemove];
      if (fileToRemove) {
        revokeFilePreviewUrl(fileToRemove);
      }
      const nextFiles = files.filter((_, i) => i !== indexToRemove);
      commitFiles(nextFiles);
      setErrors([]);
    },
    [disabled, loading, files, commitFiles]
  );

  const handleBrowseClick = () => {
    if (isInactive) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInactive) return;
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInactive) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isInactive) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleCardDragStart = (e: DragEvent, index: number) => {
    if (disabled || loading || !isMultiple) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleCardDragOver = (e: DragEvent, index: number) => {
    if (disabled || loading || !isMultiple) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleCardDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardDrop = (e: DragEvent, targetIndex: number) => {
    if (disabled || loading || !isMultiple) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const fromData = e.dataTransfer.getData("text/plain");
    const fromIndex =
      draggedIndex ?? (fromData ? parseInt(fromData, 10) : null);

    if (
      fromIndex !== null &&
      !isNaN(fromIndex) &&
      fromIndex !== targetIndex &&
      fromIndex >= 0 &&
      fromIndex < files.length &&
      targetIndex >= 0 &&
      targetIndex < files.length
    ) {
      const reordered = [...files];
      const [movedItem] = reordered.splice(fromIndex, 1);
      if (movedItem) {
        reordered.splice(targetIndex, 0, movedItem);
        commitFiles(reordered);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCardDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const defaultSubtitle = useMemo(() => {
    if (loading) {
      return "Please wait while files are uploading.";
    }
    if (isMaxReached) {
      return `Maximum of ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} reached.`;
    }
    const countMsg = `Up to ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"}.`;
    if (maxFileSize) {
      return `${countMsg} Max size ${formatFileSize(maxFileSize)}.`;
    }
    return countMsg;
  }, [loading, isMaxReached, effectiveMaxFiles, maxFileSize]);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-foreground select-none"
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        data-testid="file-upload-input"
        accept={accept}
        multiple={isMultiple}
        disabled={disabled || loading || isMaxReached}
        required={required && files.length === 0}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        role="button"
        tabIndex={isInactive ? -1 : 0}
        aria-label="Upload files"
        aria-disabled={isInactive}
        aria-invalid={Boolean(error) || errors.length > 0 ? true : undefined}
        data-dropzone="true"
        onClick={handleBrowseClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all outline-none",
          "bg-secondary border-border hover:border-primary hover:bg-muted/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-card",
          isDragging && "border-primary bg-primary/5",
          (Boolean(error) || errors.length > 0) && "border-destructive bg-destructive/5",
          isInactive && "cursor-not-allowed opacity-50",
          !isInactive && "cursor-pointer"
        )}
      >
        {loading ? (
          <Spinner className="size-8 text-primary mb-3" />
        ) : (
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="size-6 text-muted-foreground stroke-[1.75]" />
          </div>
        )}

        <p className="text-sm font-semibold text-foreground">
          {loading
            ? "Uploading..."
            : (dropzoneTitle ??
              (isMaxReached
                ? `Maximum of ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} reached`
                : "Drag and drop files here, or click to browse"))}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {dropzoneSubtitle ?? defaultSubtitle}
        </p>
      </div>

      {(Boolean(error) || errors.length > 0) && (
        <div role="alert" className="mt-2 space-y-1">
          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}
          {errors.map((err, i) => (
            <p key={i} className="text-xs font-medium text-destructive">{err}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Uploaded files</span>
            <span>
              {files.length} of {effectiveMaxFiles}{" "}
              {effectiveMaxFiles === 1 ? "file" : "files"} uploaded
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((file, index) => {
              const isImage = isImageFile(file);
              const previewUrl = isImage ? getFilePreviewUrl(file) : "";
              const isCover = index === 0;
              const isBeingDragged = draggedIndex === index;
              const isDropTarget =
                dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={getFileKey(file, index)}
                  draggable={!disabled && !loading && isMultiple}
                  onDragStart={(e) => handleCardDragStart(e, index)}
                  onDragOver={(e) => handleCardDragOver(e, index)}
                  onDragLeave={handleCardDragLeave}
                  onDrop={(e) => handleCardDrop(e, index)}
                  onDragEnd={handleCardDragEnd}
                  className={cn(
                    "group relative aspect-square rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-xs",
                    isBeingDragged && "opacity-40 scale-95 border-primary",
                    isDropTarget &&
                      "ring-2 ring-primary border-primary scale-105",
                    !disabled &&
                      !loading &&
                      isMultiple &&
                      "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {isCover && (
                    <Badge
                      variant="default"
                      className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs pointer-events-none"
                    >
                      COVER
                    </Badge>
                  )}

                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    disabled={disabled || loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className={cn(
                      "absolute top-2 right-2 z-10 size-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer",
                      (disabled || loading) && "pointer-events-none opacity-50"
                    )}
                  >
                    <X className="size-3.5" />
                  </button>

                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      onError={(e) => {
                        try {
                          if (file instanceof Blob && typeof URL !== "undefined") {
                            const fresh = URL.createObjectURL(file);
                            globalFileUrlCache.set(file, fresh);
                            (e.target as HTMLImageElement).src = fresh;
                          }
                        } catch {
                          // Ignore
                        }
                      }}
                      className="h-full w-full object-cover select-none pointer-events-none"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center select-none">
                      <FileText className="size-8 text-muted-foreground mb-2 shrink-0" />
                      <p className="w-full truncate text-xs font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  )}

                  {isImage && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="truncate text-xs font-medium">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-white/80">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {!isMaxReached && !disabled && !loading && (
              <button
                type="button"
                onClick={handleBrowseClick}
                aria-label="Add more files"
                className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer outline-none focus-visible:border-primary"
              >
                <Plus className="size-6 stroke-[1.75]" />
                <span className="text-xs font-semibold">Add More</span>
              </button>
            )}
          </div>

          {helperText && (
            <p className="mt-3 text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
