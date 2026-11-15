"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewImport, runImport, type Preview } from "./actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TagPill } from "@/components/ui/TagPill";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";
import { table } from "@/components/ui/table";

// Step 1: choose a file. The server checks it and shows what would happen. Nothing is saved.
// Step 2: confirm. The server checks the same text again and saves the rows that are allowed in.

const STATUS = {
  ready: { label: "Ready", tone: "mint", icon: <CheckIcon size={14} /> },
  warning: { label: "Warning", tone: "sun", icon: <AlertIcon size={14} /> },
  skipped: { label: "Skipped", tone: "plain", icon: null },
} as const;

export function ImportForm({ item }: { item: { singular: string; plural: string } }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [includeWarnings, setIncludeWarnings] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setPreview(null);
    setDone(null);
    setIncludeWarnings(false);
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    startTransition(async () => setPreview(await previewImport(content)));
  }

  function onImport() {
    startTransition(async () => {
      const result = await runImport(text, includeWarnings);
      if (!result.ok) {
        setPreview(result);
        return;
      }
      setDone(`Imported ${result.inserted} ${result.inserted === 1 ? item.singular : item.plural}. ${result.inserted === 1 ? "It's" : "They're"} in the list below.`);
      setPreview(null);
      if (input.current) input.current.value = "";
      setText("");
      router.refresh();
    });
  }

  const counts = preview?.ok ? preview.counts : null;
  const toImport = counts ? counts.ready + (includeWarnings ? counts.warning : 0) : 0;

  return (
    <div className="grid gap-5">
      <div>
        <label htmlFor="csv-file" className="mb-1 block text-sm font-bold">
          Choose a CSV file
        </label>
        <input
          id="csv-file"
          ref={input}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full max-w-md text-base file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-control file:border-[1.5px] file:border-teal file:bg-card file:px-4 file:font-extrabold file:text-teal"
        />
      </div>

      {pending && <p role="status">Checking {fileName || "the file"}...</p>}
      {done && (
        <Notice kind="success">
          <p>{done}</p>
        </Notice>
      )}
      {preview && !preview.ok && (
        <Notice kind="error">
          <p>{preview.message}</p>
        </Notice>
      )}

      {preview?.ok && counts && (
        <section aria-label="What would happen" className="grid gap-4">
          <p className="text-lg">
            <strong>{fileName}</strong>: {counts.ready} ready, {counts.warning} with warnings, {counts.skipped} skipped.
          </p>
          <div className={table.wrap} tabIndex={0} role="region" aria-label="What would happen to each row. Scrolls sideways on a small screen.">
            <table className={table.table}>
              <thead>
                <tr>
                  <th scope="col" className={table.th}>Line</th>
                  <th scope="col" className={table.th}>Name</th>
                  <th scope="col" className={table.th}>What will happen</th>
                  <th scope="col" className={table.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {preview.reports.map((r) => {
                  const s = STATUS[r.status];
                  return (
                    <tr key={r.line}>
                      <td className={`${table.td} tabular-nums`}>{r.line}</td>
                      <td className={`${table.td} font-bold`}>{r.name || <span className="font-medium text-muted">(no name)</span>}</td>
                      <td className={table.td}>
                        <TagPill tone={s.tone} icon={s.icon}>
                          {s.label}
                        </TagPill>
                      </td>
                      <td className={table.td}>
                        {r.notes.length ? r.notes.map((n) => <p key={n}>{n}</p>) : <span className="text-muted">Looks good.</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {counts.warning > 0 && (
            <label className="flex min-h-11 items-start gap-3">
              <input
                type="checkbox"
                checked={includeWarnings}
                onChange={(e) => setIncludeWarnings(e.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 accent-teal"
              />
              <span>
                Also import the {counts.warning} {counts.warning === 1 ? "row" : "rows"} with warnings. Any cell I couldn&apos;t
                read is left blank.
              </span>
            </label>
          )}

          <div>
            <Button onClick={onImport} disabled={pending || toImport === 0}>
              Import {toImport} {toImport === 1 ? item.singular : item.plural}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
