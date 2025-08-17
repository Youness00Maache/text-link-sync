import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText } from 'lucide-react';
import { Note, cleanText } from '@/lib/textUtils';

interface NotesListProps {
  notes: Note[];
  onNoteSelect: (index: number) => void;
  className?: string;
}

export const NotesList = ({ notes, onNoteSelect, className = "" }: NotesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    return notes.filter(note => 
      cleanText(note.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanText(note.content).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  if (notes.length === 0) {
    return (
      <Card className={`${className} card-shadow-soft`}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No saved texts found. Send some text from your phone to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your texts..."
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No texts match your search.
          </p>
        ) : (
          filteredNotes.map((note, index) => {
            const originalIndex = notes.findIndex(n => n === note);
            return (
              <Button
                key={originalIndex}
                onClick={() => onNoteSelect(originalIndex)}
                variant="outline"
                className="w-full h-auto p-4 text-left justify-start hover:card-shadow-soft transition-smooth"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base mb-1 truncate">
                    {cleanText(note.title) || "Untitled"}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {cleanText(note.content).substring(0, 100)}
                    {cleanText(note.content).length > 100 ? '...' : ''}
                  </p>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
};