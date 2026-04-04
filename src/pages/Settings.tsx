import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import type { ProgramBlock, WorkoutSession } from "../lib/types";
import {
  loadRestTimerDuration,
  saveRestTimerDuration,
} from "../lib/storage";
import { Download, Upload, Timer, Heart } from "lucide-react";

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
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [restDuration, setRestDuration] = useState<number>(
    loadRestTimerDuration,
  );

  const handleRestDurationChange = (seconds: number) => {
    setRestDuration(seconds);
    saveRestTimerDuration(seconds);
  };

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([""], "test.json", { type: "application/json" })] });

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

  const handleExportRoutine = async () => {
    const data = { programs: state.programs, sessions: [] };
    const fileName = `pushlog-routine-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(data, null, 2)], fileName, {
      type: "application/json",
    });
    await downloadOrShare(file, "Pushlog Routine");
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
        dispatch({
          type: "IMPORT_STATE",
          payload: {
            programs: parsed.programs as ProgramBlock[],
            sessions: parsed.sessions as WorkoutSession[],
          },
        });
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

        {/* Export */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-1">Export data</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Download all programs and workout history as a JSON file.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Export backup
            </button>
            <button
              onClick={handleExportRoutine}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Export routine
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-1">Import data</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Restore from a previously exported JSON file. This will replace all
            current data.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Upload size={16} />
            Import JSON
          </button>
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
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Heart size={16} />
            Donate
          </a>
        </div>
      </div>
    </div>
  );
}
