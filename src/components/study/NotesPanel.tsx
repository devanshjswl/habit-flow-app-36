import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, X, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNoteActions, useNotes, markNotesSeen, getLastSeen, type Note } from "@/hooks/use-notes";
import { compressMedia, formatBytes } from "@/lib/compress";
import { USERS, type Profile, type UserId } from "@/lib/study";

const MAX_BYTES = 60 * 1024 * 1024;

export function NotesPanel({
  uid,
  profiles,
  limit,
  autoMarkSeen = true,
  className = "",
}: {
  uid: UserId;
  profiles: Record<UserId, Profile>;
  limit?: number;
  autoMarkSeen?: boolean;
  className?: string;
}) {
  const { notes, error } = useNotes();
  const { send, remove } = useNoteActions(uid);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState<null | "compressing" | "sending">(null);
  const [progress, setProgress] = useState(0);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    setSeenAt(getLastSeen());
    if (autoMarkSeen) markNotesSeen();
  }, [uid, autoMarkSeen]);

  useEffect(() => {
    if (autoMarkSeen && notes.length) markNotesSeen();
  }, [autoMarkSeen, notes.length]);


  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = async (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File is too large — keep it under 60 MB");
      return;
    }
    if (!f.type.startsWith("image") && !f.type.startsWith("video")) {
      toast.error("Only images and short videos are supported");
      return;
    }
    setWorking("compressing");
    setProgress(0);
    const result = await compressMedia(f, setProgress);
    setFile(result.file);
    setOriginal(result.originalBytes);
    setWorking(null);
    if (result.bytes < result.originalBytes) {
      toast.success(`Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(result.bytes)}`);
    }
  };

  const submit = async () => {
    if (working || (!text.trim() && !file)) return;
    setWorking("sending");
    try {
      await send(text, file);
      setText("");
      setFile(null);
      setOriginal(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send note");
    } finally {
      setWorking(null);
    }
  };

  const unread = notes.filter((n) => n.uid !== uid && n.createdAt > seenAt).length;
  const shown = limit ? notes.slice(0, limit) : notes;
  const other = USERS[uid === "dev" ? "oshu" : "dev"].defaultName;

  return (
    <div className={`glass rounded-3xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" /> Notes
          {unread > 0 && (
            <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tracking-normal">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {unread > 0 ? `${unread} unread from ${other}` : "All caught up"}
        </span>
      </div>

      {error && <p className="mb-3 text-xs text-destructive">Sync issue: {error}</p>}

      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={2}
          placeholder={`Write something for ${other}…`}
          className="w-full rounded-xl bg-input/60 border px-3 py-2.5 text-sm resize-none placeholder:text-muted-foreground/60"
        />

        {working === "compressing" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compressing… {progress ? `${progress}%` : ""}
          </div>
        )}

        {preview && file && (
          <div className="relative w-fit">
            {file.type.startsWith("video") ? (
              <video src={preview} className="max-h-40 rounded-xl border" controls />
            ) : (
              <img src={preview} alt="Attachment preview" className="max-h-40 rounded-xl border" />
            )}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setOriginal(null);
              }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full glass-strong flex items-center justify-center hover:text-destructive"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {original && original !== file.size
                ? `${formatBytes(original)} → ${formatBytes(file.size)}`
                : formatBytes(file.size)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={working === "compressing"}
            className="inline-flex items-center gap-2 rounded-xl glass-soft px-3 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4" /> Photo or clip
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!!working || (!text.trim() && !file)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 h-11 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {working === "sending" ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet — send the first one.</p>
        ) : (
          shown.map((n) => (
            <NoteBubble
              key={n.id}
              note={n}
              mine={n.uid === uid}
              unread={n.uid !== uid && n.createdAt > seenAt}
              name={profiles[n.uid]?.name ?? USERS[n.uid].defaultName}
              avatar={profiles[n.uid]?.avatar ?? "🙂"}
              onDelete={() => remove(n)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NoteBubble({
  note,
  mine,
  unread,
  name,
  avatar,
  onDelete,
}: {
  note: Note;
  mine: boolean;
  unread: boolean;
  name: string;
  avatar: string;
  onDelete: () => void;
}) {
  return (
    <div className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <div className="w-9 h-9 rounded-2xl glass-strong flex items-center justify-center text-base shrink-0">{avatar}</div>
      <div
        className={`group relative max-w-[85%] rounded-2xl p-3.5 ${mine ? "glass-soft" : "glass"} ${
          unread ? "ring-1 ring-primary/50" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
          <span className="font-medium text-foreground/80">{name}</span>
          <span>
            {new Date(note.createdAt).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {unread && <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 font-medium">new</span>}
        </div>

        {note.text && <p className="text-sm whitespace-pre-wrap text-foreground/90">{note.text}</p>}

        {note.mediaUrl && (
          <div className="mt-2.5">
            {note.mediaType === "video" ? (
              <video src={note.mediaUrl} controls playsInline preload="metadata" className="rounded-xl max-h-72 w-full" />
            ) : (
              <a href={note.mediaUrl} target="_blank" rel="noreferrer">
                <img src={note.mediaUrl} alt="Shared attachment" loading="lazy" className="rounded-xl max-h-72 object-cover" />
              </a>
            )}
          </div>
        )}

        {mine && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute -top-2 -left-2 w-7 h-7 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            aria-label="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
