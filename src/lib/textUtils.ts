// Utilities for parsing and formatting text

export interface Note {
  title: string;
  content: string;
}

export const parseTextToNotes = (text: string): Note[] => {
  const blocks = text.split(/\n\s*\n/).filter(block => block.trim() !== '');
  const notes: Note[] = [];

  for (let i = 0; i < blocks.length; i += 2) {
    let note: Note = { title: "", content: "" };

    // Parse title
    if (blocks[i].toLowerCase().startsWith('title:')) {
      note.title = blocks[i].substring(6).replace(/["""]+/g, '').trim();
    } else {
      note.title = blocks[i].replace(/["""]+/g, '').trim();
    }

    // Parse content
    if (i + 1 < blocks.length) {
      if (blocks[i + 1].toLowerCase().startsWith('content:')) {
        note.content = blocks[i + 1].substring(8).replace(/["""]+/g, '').trim();
      } else {
        note.content = blocks[i + 1].replace(/["""]+/g, '').trim();
      }
    }

    notes.push(note);
  }

  return notes;
};

export const formatNotesToText = (notes: Note[]): string => {
  return notes
    .map(note => `${note.title}\n\n${note.content}`)
    .join('\n\n\n\n');
};

export const cleanText = (text: string): string => {
  return text.replace(/["""]+/g, '').trim();
};