import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { NotesList } from '@/components/NotesList';
import { SendToPhone } from '@/components/SendToPhone';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { parseTextToNotes, Note } from '@/lib/textUtils';

const Titles = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleTextUpdate = (text: string) => {
    const parsedNotes = parseTextToNotes(text);
    setNotes(parsedNotes);
    setIsLoading(false);
  };

  useSocket(token, handleTextUpdate);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    // Load initial text
    const loadInitialText = async () => {
      const text = await api.getText(token);
      if (text) {
        handleTextUpdate(text);
      } else {
        setIsLoading(false);
      }
    };

    loadInitialText();
  }, [token, navigate]);

  const handleNoteSelect = (index: number) => {
    navigate(`/text?token=${token}&index=${index}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleQRCode = () => {
    navigate('/?showQR=1');
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <AppHeader
          onBack={handleBack}
          onQRCode={handleQRCode}
          showBackButton={true}
          showQRButton={true}
        />

        <div className="space-y-6">
          {/* Send to Phone Feature - At the top */}
          <SendToPhone token={token} />

          {/* Notes List */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Your Texts</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading your texts...</p>
                </div>
              ) : (
                <NotesList notes={notes} onNoteSelect={handleNoteSelect} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Titles;