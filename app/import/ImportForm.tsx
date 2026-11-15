"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewImport, runImport, type Preview } from "./actions";

// Step 1: choose a file. The server checks it and shows what would happen. Nothing is saved.
// Step 2: confirm. The server checks the same text again and saves the rows that are allowed in.

const STATUS_LABEL = { ready: "Ready", warning: "Warning", skipped: "Skipped" } as const;
const STATUS_STYLE = {
  ready: "bg-green-100 text-green-900",
  warning: "bg-amber-100 text-amber-900",
  skipped: "bg-zinc-200 text-zinc-800",
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
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-medium">Choose a CSV file</span>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full max-w-md text-sm file:mr-3 file:rounded-full file:border file:border-zinc-300 file:bg-white file:px-4 file:py-2 file:font-medium"
        />
      </label>

      {pending && <p role="status">Checking {fileName || "the file"}...</p>}
      {done && <p role="status" className="rounded-lg bg-green-100 px-4 py-3 text-green-900">{done}</p>}
      {preview && !preview.ok && (
        <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-red-900">{preview.message}</p>
      )}

      {preview?.ok && counts && (
        <section aria-label="What would happen" className="flex flex-col gap-4">
          <p className="text-lg">
            <strong>{fileName}</strong>: {counts.ready} ready, {counts.warning} with warnings, {counts.skipped} skipped.
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Line</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">What will happen</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {preview.reports.map((r) => (
                  <tr key={r.line} className="border-t border-zinc-200 align-top">
                    <td className="px-3 py-2 tabular-nums">{r.line}</td>
                    <td className="px-3 py-2 font-medium">{r.name || <span className="text-zinc-500">(no name)</span>}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {r.notes.length ? r.notes.map((n) => <p key={n}>{n}</p>) : <span className="text-zinc-500">Looks good.</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {counts.warning > 0 && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={includeWarnings}
                onChange={(e) => setIncludeWarnings(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              <span>
                Also import the {counts.warning} {counts.warning === 1 ? "row" : "rows"} with warnings. Any cell I couldn&apos;t
                read is left blank.
              </span>
            </label>
          )}

          <div>
            <button
              type="button"
              onClick={onImport}
              disabled={pending || toImport === 0}
              className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Import {toImport} {toImport === 1 ? item.singular : item.plural}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
