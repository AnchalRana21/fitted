"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
};

/**
 * In-app replacement for window.confirm. Escape and Cancel close it, the overlay does not.
 * If onConfirm returns a promise the dialog stays open showing "Working…" until it settles;
 * errors close the dialog and are left for the caller to report.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false);
  // Opened programmatically (no Radix Trigger), so remember what had focus to restore it on close.
  const returnFocus = useRef<HTMLElement | null>(null);
  const busyRef = useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (working && !next) return; // don't dismiss mid-action
    onOpenChange(next);
  };

  const confirm = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Radix would close on click; we close once onConfirm settles.
    if (busyRef.current) return; // ignore double activation
    busyRef.current = true;
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setWorking(true);
        await result;
      }
    } catch {
      // Sync throw or rejection: close anyway; the caller owns error reporting.
    } finally {
      setWorking(false);
    }
    try {
      onOpenChange(false);
    } finally {
      busyRef.current = false; // released only after the close is requested
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-[rgb(var(--shadow-color)/0.45)] backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />
        <AlertDialog.Content
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            const target = returnFocus.current;
            returnFocus.current = null;
            if (target?.isConnected) {
              event.preventDefault();
              target.focus();
            }
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg data-[state=open]:animate-dialog-in"
        >
          <AlertDialog.Title className="text-lg font-semibold text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-ink-2">{description}</AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={working}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={tone === "danger" ? "danger" : "primary"} disabled={working} onClick={confirm}>
                {working ? "Working…" : confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
