import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { NotesList } from '@/components/NotesList';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { parseTextToNotes, Note } from '@/lib/textUtils';

const Titles = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalText, setOriginalText] = useState<string>('');

  const handleTextUpdate = (text: string) => {
    console.log('Received text update:', text); // Debug log
    setOriginalText(text); // Keep track of the original text
    const parsedNotes = parseTextToNotes(text);
    setNotes(parsedNotes);
    setIsLoading(false);
  };

  const { socket, isConnected } = useSocket(token, handleTextUpdate);

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

        {/* Connection Status Indicator */}
        <div className={`flex items-center justify-center py-2 px-4 rounded-lg mb-4 ${
          isConnected 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {isConnected ? (
            <><Wifi className="h-4 w-4 mr-2" /> Connected</>
          ) : (
            <><WifiOff className="h-4 w-4 mr-2" /> Reconnecting...</>
          )}
        </div>

        <div className="space-y-6">
          {/* Send to Phone Button - At the top */}
          <Card className="card-shadow-soft">
            <CardContent className="p-6">
              <Button
                onClick={() => navigate(`/send?token=${token}&originalText=${encodeURIComponent(originalText)}`)}
                variant="success"
                size="lg"
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Phone
              </Button>
            </CardContent>
          </Card>

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