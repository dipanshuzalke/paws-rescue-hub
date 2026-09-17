import { MessageSquare } from "lucide-react";

interface Note {
  id: string;
  author: string;
  role: string;
  at: string;
  text: string;
}

interface NotesSectionProps {
  notes?: Note[];
}

export function NotesSection({ notes = [] }: NotesSectionProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />

        <h2 className="text-lg font-semibold">
          Case Notes
        </h2>

        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {notes.length}
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No notes have been added to this report yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border bg-muted/30 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {note.author}
                  </span>

                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                    {note.role}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(note.at).toLocaleString()}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}