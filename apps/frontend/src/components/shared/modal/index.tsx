import {
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/shared/button";
import { cn } from "@/lib/utils";

export interface ModalRef {
  open: () => void;
  close: () => void;
}

export interface ModalProps {
  /**
   * Controlled open state.
   */
  open?: boolean;
  /**
   * Called when the modal is dismissed via cancel, escape, outside click, or close button.
   */
  onCancel?: () => void;
  /**
   * Called when the OK button is clicked.
   * Does NOT automatically close the modal.
   */
  onOk?: () => void;
  /**
   * Title rendered in the modal header.
   */
  title?: ReactNode;
  /**
   * Footer content.
   * undefined = default footer with OK/Cancel buttons.
   * ReactNode = custom footer.
   * null = no footer.
   */
  footer?: ReactNode | null;
  /**
   * Text for the OK button.
   * @default 'OK'
   */
  okText?: ReactNode;
  /**
   * Text for the Cancel button.
   * @default 'Cancel'
   */
  cancelText?: ReactNode;
  /**
   * Modal body content.
   */
  children?: ReactNode;
  /**
   * Whether to show the close button (X) in the header.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Width of the modal.
   * Can be a number (pixels) or a CSS string (e.g., '40rem').
   * @default 520
   */
  width?: number | string;
  /**
   * Additional className for the DialogContent.
   */
  className?: string;
  /**
   * Additional className for the scrollable modal body.
   */
  bodyClassName?: string;
  /**
   * Props forwarded to the OK button.
   */
  okButtonProps?: Partial<ButtonProps>;
  /**
   * Props forwarded to the Cancel button.
   */
  cancelButtonProps?: Partial<ButtonProps>;
  /**
   * When true, the modal is non-dismissible and shows loading state.
   * Disables cancel/ok buttons, hides close button, prevents escape/outside click.
   * @default false
   */
  confirmLoading?: boolean;
}

const DEFAULT_WIDTH = 520;
const DEFAULT_OK_TEXT = "OK";
const DEFAULT_CANCEL_TEXT = "Cancel";

export const Modal = forwardRef<ModalRef, ModalProps>(
  (
    {
      open: controlledOpen,
      onCancel,
      onOk,
      title,
      footer,
      okText = DEFAULT_OK_TEXT,
      cancelText = DEFAULT_CANCEL_TEXT,
      children,
      showCloseButton = true,
      width = DEFAULT_WIDTH,
      className,
      bodyClassName,
      okButtonProps,
      cancelButtonProps,
      confirmLoading = false,
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : internalOpen;

    const onCancelRef = useRef(onCancel);
    const onOkRef = useRef(onOk);
    const confirmLoadingRef = useRef(confirmLoading);

    onCancelRef.current = onCancel;
    onOkRef.current = onOk;
    confirmLoadingRef.current = confirmLoading;

    const handleOpenChange = (newOpen: boolean) => {
      if (confirmLoadingRef.current) {
        return;
      }

      if (!isControlled) {
        setInternalOpen(newOpen);
      }

      if (!newOpen) {
        onCancelRef.current?.();
      }
    };

    const handleCancel = () => {
      if (confirmLoadingRef.current) {
        return;
      }

      if (!isControlled) {
        setInternalOpen(false);
      }
      onCancelRef.current?.();
    };

    const handleOk = () => {
      onOkRef.current?.();
    };

    useImperativeHandle(ref, () => ({
      open: () => setInternalOpen(true),
      close: () => setInternalOpen(false),
    }));

    const widthStyle: CSSProperties = width
      ? {
          maxWidth: typeof width === "number" ? `${width}px` : width,
        }
      : {};

    return (
      <Dialog open={effectiveOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] w-full gap-0 overflow-hidden rounded-2xl sm:max-w-none border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl",
            className
          )}
          style={widthStyle}
          showCloseButton={showCloseButton && !confirmLoading}
        >
          {title && (
            <DialogHeader className="shrink-0 pb-4 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </DialogTitle>
            </DialogHeader>
          )}

          <div
            className={cn(
              "flex-1 overflow-y-auto min-h-0 py-2 text-sm text-foreground",
              bodyClassName
            )}
          >
            {children}
          </div>

          {footer === undefined ? (
            <DialogFooter className="shrink-0 mt-6 pt-4 border-t border-black/5 dark:border-white/10 gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={confirmLoading || cancelButtonProps?.disabled}
                {...cancelButtonProps}
              >
                {cancelText}
              </Button>

              <Button
                onClick={handleOk}
                disabled={confirmLoading || okButtonProps?.disabled}
                {...okButtonProps}
              >
                {confirmLoading && (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="sr-only">Loading</span>
                  </>
                )}
                {okText}
              </Button>
            </DialogFooter>
          ) : footer !== null ? (
            <DialogFooter className="shrink-0 mt-6 pt-4 border-t border-black/5 dark:border-white/10">
              {footer}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }
);

Modal.displayName = "Modal";
