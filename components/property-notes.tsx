"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Info,
  Flag,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  type: "general" | "flag" | "alert" | "info";
  author: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface PropertyNotesProps {
  propertyId: string;
  className?: string;
}

const NOTE_TYPES = [
  { id: "general", label: "General", icon: MessageSquare, color: "text-muted-foreground" },
  { id: "flag", label: "Flag", icon: Flag, color: "text-[hsl(var(--warning))]" },
  { id: "alert", label: "Alert", icon: AlertTriangle, color: "text-destructive" },
  { id: "info", label: "Info", icon: Info, color: "text-primary" },
] as const;

// Mock notes for demo
const getMockNotes = (propertyId: string): Note[] => {
  const seed = propertyId.charCodeAt(propertyId.length - 1);
  if (seed % 3 === 0) return [];
  
  return [
    {
      id: "note-1",
      content: "Property requires physical inspection due to significant value change from prior year. Schedule for Q2 review cycle.",
      type: "flag",
      author: "Sarah Chen",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "note-2",
      content: "Comparable sales analysis completed. Values are in line with neighborhood median.",
      type: "general",
      author: "Mike Rodriguez",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: "note-3",
      content: "Owner appealed 2024 assessment. Appeal pending review by board.",
      type: "alert",
      author: "Sarah Chen",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
};

export function PropertyNotes({ propertyId, className }: PropertyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<Note["type"]>("general");
  const [editContent, setEditContent] = useState("");

  // Load notes (in production, this would be an API call)
  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem(`terra-notes-${propertyId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed.map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: n.updatedAt ? new Date(n.updatedAt) : undefined,
        })));
      } catch {
        setNotes(getMockNotes(propertyId));
      }
    } else {
      setNotes(getMockNotes(propertyId));
    }
  }, [propertyId]);

  // Save to localStorage when notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(`terra-notes-${propertyId}`, JSON.stringify(notes));
    }
  }, [notes, propertyId]);

  const addNote = () => {
    if (!newNoteContent.trim()) return;

    const note: Note = {
      id: `note-${Date.now()}`,
      content: newNoteContent.trim(),
      type: newNoteType,
      author: "Sarah Chen", // Would come from auth context
      createdAt: new Date(),
    };

    setNotes([note, ...notes]);
    setNewNoteContent("");
    setNewNoteType("general");
    setIsAdding(false);
  };

  const updateNote = (id: string) => {
    if (!editContent.trim()) return;

    setNotes(notes.map(n => 
      n.id === id 
        ? { ...n, content: editContent.trim(), updatedAt: new Date() }
        : n
    ));
    setEditingId(null);
    setEditContent("");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getNoteTypeConfig = (type: Note["type"]) => {
    return NOTE_TYPES.find(t => t.id === type) || NOTE_TYPES[0];
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Assessor Notes</h3>
          {notes.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {notes.length}
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Add Note
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              {NOTE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setNewNoteType(type.id as Note["type"])}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                      newNoteType === type.id
                        ? "bg-primary/10 text-primary"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-3 w-3", newNoteType === type.id && type.color)} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note..."
            className="mb-3 h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent("");
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={addNote}
              disabled={!newNoteContent.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-80 divide-y divide-border overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground/60">Add notes to track assessment history</p>
          </div>
        ) : (
          notes.map((note) => {
            const typeConfig = getNoteTypeConfig(note.type);
            const Icon = typeConfig.icon;
            const isEditing = editingId === note.id;

            return (
              <div key={note.id} className="p-4">
                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2 h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateNote(note.id)}
                        className="rounded p-1 text-primary hover:text-primary/80"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4 shrink-0", typeConfig.color)} />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="mb-2 text-sm text-foreground">{note.content}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {note.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(note.createdAt)}
                        {note.updatedAt && " (edited)"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
