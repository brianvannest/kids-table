"use client";

import { useRef } from "react";
import { Button } from "./Button";

// A destructive action asks "are you sure?" first. The trigger is a secondary button. The
// button that actually does it is the one tomato button, inside the dialog. It uses the browser's
// own <dialog>, which traps the keyboard focus and closes with the Escape key.
export function ConfirmDialog({
  triggerLabel,
  title,
  children,
  confirmLabel,
  action,
  fields,
}: {
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  /** A server action. It runs when the person confirms. */
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden values the action needs, such as which person. */
  fields: Record<string, string>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => dialog.current?.showModal()}>
        {triggerLabel}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(92vw,28rem)] rounded-card border border-line bg-card p-6 text-ink shadow-card backdrop:bg-ink/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <h2 id="confirm-title" className="text-[22px] font-extrabold leading-7">
          {title}
        </h2>
        <div className="mt-2">{children}</div>
        <form action={action} className="mt-5 flex flex-wrap justify-end gap-3" onSubmit={() => dialog.current?.close()}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button type="submit">{confirmLabel}</Button>
        </form>
      </dialog>
    </>
  );
}
