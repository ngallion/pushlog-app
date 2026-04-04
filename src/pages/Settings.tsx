import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import type { ProgramBlock, WorkoutSession } from "../lib/types";
import {
  loadRestTimerDuration,
  saveRestTimerDuration,
  migrateImportedData,
} from "../lib/storage";
import {
  Download,
  Upload,
  Timer,
  Heart,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

const REST_DURATION_OPTIONS = [60, 90, 120, 180] as const;

function isValidProgram(p: unknown): p is ProgramBlock {
  if (!p || typeof p !== "object") return false;
  const prog = p as Record<string, unknown>;
  return (
    typeof prog.id === "string" &&
    typeof prog.startedAt === "string" &&
    prog.workouts !== null &&
    typeof prog.workouts === "object" &&
    !Array.isArray(prog.workouts)
  );
}

function isValidSession(s: unknown): s is WorkoutSession {
  if (!s || typeof s !== "object") return false;
  const sess = s as Record<string, unknown>;
  const hasTimestamp =
    typeof sess.startedAt === "string" || typeof sess.date === "string";
  return (
    typeof sess.id === "string" &&
    hasTimestamp &&
    typeof sess.workoutType === "string" &&
    typeof sess.programBlockId === "string" &&
    Array.isArray(sess.exercises)
  );
}

export function Settings() {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [programImportStatus, setProgramImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [programErrorMessage, setProgramErrorMessage] = useState("");
  const [restDuration, setRestDuration] = useState<number>(
    loadRestTimerDuration,
  );
  const [copied, setCopied] = useState(false);

  const handleRestDurationChange = (seconds: number) => {
    setRestDuration(seconds);
    saveRestTimerDuration(seconds);
  };

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({
      files: [new File([""], "test.json", { type: "application/json" })],
    });

  const downloadOrShare = async (file: File, title: string) => {
    if (canShare) {
      try {
        await navigator.share({ title, files: [file] });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    const data = { programs: state.programs, sessions: state.sessions };
    const fileName = `pushlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(data, null, 2)], fileName, {
      type: "application/json",
    });
    await downloadOrShare(file, "Pushlog Backup");
  };

  const handleExportProgram = async () => {
    const data = { programs: state.programs, sessions: [] };
    const fileName = `pushlog-program-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(data, null, 2)], fileName, {
      type: "application/json",
    });
    await downloadOrShare(file, "Pushlog Program");
  };

  const handleImportProgram = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed.programs)) {
          throw new Error("Invalid file: missing programs array");
        }
        const invalidProgram = parsed.programs.findIndex(
          (p: unknown) => !isValidProgram(p),
        );
        if (invalidProgram !== -1) {
          throw new Error(
            `Invalid program at index ${invalidProgram}: missing required fields (id, startedAt, workouts)`,
          );
        }
        const migrated = migrateImportedData(
          parsed.programs as ProgramBlock[],
          state.sessions,
        );
        dispatch({ type: "IMPORT_STATE", payload: migrated });
        setProgramImportStatus("success");
        setProgramErrorMessage("");
      } catch (err) {
        setProgramImportStatus("error");
        setProgramErrorMessage(
          err instanceof Error ? err.message : "Failed to parse file",
        );
      }
      if (programFileInputRef.current) programFileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (
          !Array.isArray(parsed.programs) ||
          !Array.isArray(parsed.sessions)
        ) {
          throw new Error("Invalid file: missing programs or sessions arrays");
        }
        const invalidProgram = parsed.programs.findIndex(
          (p: unknown) => !isValidProgram(p),
        );
        if (invalidProgram !== -1) {
          throw new Error(
            `Invalid program at index ${invalidProgram}: missing required fields (id, startedAt, workouts)`,
          );
        }
        const invalidSession = parsed.sessions.findIndex(
          (s: unknown) => !isValidSession(s),
        );
        if (invalidSession !== -1) {
          throw new Error(
            `Invalid session at index ${invalidSession}: missing required fields (id, workoutType, programBlockId, exercises)`,
          );
        }
        const migrated = migrateImportedData(
          parsed.programs as ProgramBlock[],
          parsed.sessions as WorkoutSession[],
        );
        dispatch({ type: "IMPORT_STATE", payload: migrated });
        setImportStatus("success");
        setErrorMessage("");
      } catch (err) {
        setImportStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to parse file",
        );
      }
      // Reset input so the same file can be re-imported if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const buildAiPrompt = () => {
    const recentSessions = [...state.sessions]
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
      .slice(0, 10);

    const data = { programs: state.programs, recentSessions };

    return `I use a strength training app called Pushlog that tracks a rotating 4-workout program (Upper A/B, Lower A/B). The rotation is: Upper A → Lower A → Upper B → Lower B → repeat. "Cycle 1" and "Cycle 2" are two different exercise variations for the same workout slot — the app alternates between them every 8 workouts.

Here is my current program and recent workout history as JSON:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Please analyze my workout program and give me specific, actionable feedback on:
1. Exercise selection and balance (push/pull ratio, muscle group coverage, movement patterns)
2. Volume and intensity — are the sets and rep ranges appropriate?
3. Weight progression — are my starting weights and rep ranges set up well for progressive overload?
4. Any gaps, redundancies, or imbalances across the Upper/Lower A/B split
5. Concrete suggestions for improvements`;
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildAiPrompt());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing silently
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-zinc-400 text-sm mb-6">Manage your data</p>

      <div className="space-y-3">
        {/* Rest Timer */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={16} className="text-violet-400" />
            <h2 className="font-semibold">Rest timer</h2>
          </div>
          <p className="text-zinc-400 text-sm mb-3">
            Automatically starts a countdown after each set. Set to "Off" to
            disable.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRestDurationChange(0)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                restDuration === 0
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              Off
            </button>
            {REST_DURATION_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleRestDurationChange(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  restDuration === s
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
          {restDuration > 0 &&
            typeof Notification !== "undefined" &&
            Notification.permission === "default" && (
              <p className="mt-3 text-xs text-zinc-500">
                Allow notifications to get an alert when rest is over.
              </p>
            )}
        </div>

        {/* AI Feedback */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-violet-400" />
            <h2 className="font-semibold">AI feedback</h2>
          </div>
          <p className="text-zinc-400 text-sm mb-3">
            Copy a prompt with your program data pre-loaded, then paste it into
            your AI of choice for personalised feedback.
          </p>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors mb-3"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy prompt"}
          </button>
          <p className="text-zinc-500 text-xs mb-2">
            Open your AI of choice and paste:
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://claude.ai/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Claude
            </a>
            <a
              href="https://chatgpt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
            >
              ChatGPT
            </a>
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Gemini
            </a>
          </div>
        </div>

        {/* Donate */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} className="text-pink-400" />
            <h2 className="font-semibold">Support Pushlog</h2>
          </div>
          <p className="text-zinc-400 text-sm mb-3">
            If Pushlog helps your training, consider buying me a coffee.
          </p>
          <a
            href="https://ko-fi.com/nicholasgallion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Heart size={16} />
            Donate
          </a>
        </div>

        {/* Program export/import */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-1">Program</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Export or import your program. Importing will replace your current
            program but will not affect your workout history.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportProgram}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Upload size={16} />
              Export program
            </button>
            <button
              onClick={() => programFileInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Import program
            </button>
          </div>
          <input
            ref={programFileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportProgram}
            className="hidden"
          />
          {programImportStatus === "success" && (
            <p className="mt-3 text-sm text-green-400">
              Program imported successfully.
            </p>
          )}
          {programImportStatus === "error" && (
            <p className="mt-3 text-sm text-red-400">{programErrorMessage}</p>
          )}
        </div>

        {/* Backup export/import */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-1">Backup</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Export or restore all programs and workout history as a JSON file.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Upload size={16} />
              Export backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Import backup
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="hidden"
          />
          {importStatus === "success" && (
            <p className="mt-3 text-sm text-green-400">
              Data imported successfully.
            </p>
          )}
          {importStatus === "error" && (
            <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
