import { settings } from "@/lib/settings";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{settings.appName}</h1>
      <p className="text-lg text-zinc-600">{settings.tagline}</p>
    </main>
  );
}
