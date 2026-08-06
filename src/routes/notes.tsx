import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppNav } from "@/components/study/AppNav";
import { NotesPanel } from "@/components/study/NotesPanel";
import { useCurrentUser, useStudyData } from "@/hooks/use-study";

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

function NotesPage() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles } = useStudyData();

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  if (!uid) return <div className="min-h-screen" />;
  const me = profiles[uid];

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={me.name} avatar={me.avatar} />

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <header className="animate-fade-up-blur">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary">Shared board</p>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-display font-bold tracking-tight">Notes</h1>
        </header>

        <NotesPanel uid={uid} profiles={profiles} />
      </div>
    </div>
  );
}
