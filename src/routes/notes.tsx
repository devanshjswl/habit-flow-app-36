import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, X, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/study/AppNav";
import { useCurrentUser, useStudyData } from "@/hooks/use-study";
import { useNoteActions, useNotes, markNotesSeen, getLastSeen, type Note } from "@/hooks/use-notes";
import { USERS } from "@/lib/study";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "Notes — Study Companion" },
      { name: "description", content: "Leave notes, photos and short clips for each other with unread badges." },
      { property: "og:title", content: "Notes — Study Companion" },
      { property: "og:description", content: "A shared note board with images, short videos and unread notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const MAX_BYTES = 25 * 1024 * 1024;

function NotesPage() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles } = useStudyData();
  const { notes, error } = useNotes();
  const { send, remove } = useNoteActions(uid);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  // Snapshot what was unread when the page opened, then mark everything read.
  useEffect(() => {
    if (!uid) return;
    setSeenAt(getLastSeen());
    markNotesSeen();
  }, [uid]);

  // Keep marking read while the board stays open.
  useEffect(() => {
    if (uid && notes.length) markNotesSeen();
  }, [uid, notes.length]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!uid) return <div className="min-h-screen" />;
  const me = profiles[uid];

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File is too large — keep it under 25 MB");
      return;
    }
    if (!f.type.startsWith("image") && !f.type.startsWith("video")) {
      toast.error("Only images and short videos are supported");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (sending || (!text.trim() && !file)) return;
    setSending(true);
    try {
      await send(text, file);
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send note");
    } finally {
      setSending(false);
    }
  };

  const unreadCount = notes.filter((n) => n.uid !== uid && n.createdAt > seenAt).length;

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={me.name} avatar={me.avatar} />

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <header className="animate-fade-up-blur">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary">Shared board</p>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-display font-bold tracking-tight">Notes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} new ${unreadCount === 1 ? "note" : "notes"} since your last visit.`
              : "You're all caught up."}
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Sync issue: {error}
          </div>
        )}

        {/* Composer */}
        <div className="glass rounded-3xl p-4 md:p-5 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={3}
            placeholder={`Write something for ${USERS[uid === "dev" ? "oshu" : "dev"].defaultName}…`}
            className="w-full rounded-xl bg-input/60 border px-3 py-2.5 text-sm resize-none placeholder:text-muted-foreground/60"
          />

          {preview && file && (
            <div className="relative w-fit">
              {file.type.startsWith("video") ? (
                <video src={preview} className="max-h-48 rounded-xl border" controls />
              ) : (
                <img src={preview} alt="Attachment preview" className="max-h-48 rounded-xl border" />
              )}
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full glass-strong flex items-center justify-center hover:text-destructive"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl glass-soft px-3 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              disabled={sending || (!text.trim() && !file)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 h-11 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        {/* Feed */}
        {notes.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notes yet — send the first one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((n) => (
              <NoteBubble
                key={n.id}
                note={n}
                mine={n.uid === uid}
                unread={n.uid !== uid && n.createdAt > seenAt}
                name={profiles[n.uid]?.name ?? USERS[n.uid].defaultName}
                avatar={profiles[n.uid]?.avatar ?? "🙂"}
                onDelete={() => remove(n)}
              />
            ))}
          </div>
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
      <div className="w-10 h-10 rounded-2xl glass-strong flex items-center justify-center text-lg shrink-0">{avatar}</div>
      <div
        className={`group relative max-w-[85%] rounded-3xl p-4 ${
          mine ? "glass-soft" : "glass"
        } ${unread ? "ring-1 ring-primary/50 glow-ring" : ""}`}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
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
          <div className="mt-3">
            {note.mediaType === "video" ? (
              <video src={note.mediaUrl} controls playsInline className="rounded-xl max-h-80 w-full" />
            ) : (
              <a href={note.mediaUrl} target="_blank" rel="noreferrer">
                <img src={note.mediaUrl} alt="Shared attachment" className="rounded-xl max-h-80 object-cover" />
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
