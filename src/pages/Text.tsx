import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { parseTextToNotes, cleanText } from '@/lib/textUtils';
import { useToast } from '@/components/ui/use-toast';

const Text = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  const indexParam = searchParams.get('index');
  const index = indexParam ? parseInt(indexParam, 10) : null;
  
  const [title, setTitle] = useState('Loading...');
  const [content, setContent] = useState('Loading content...');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!token || index === null) {
      navigate('/');
      return;
    }

    const loadContent = async () => {
      try {
        const text = await api.getText(token);
        if (text) {
          const notes = parseTextToNotes(text);
          if (index >= 0 && index < notes.length) {
            const note = notes[index];
            setTitle(cleanText(note.title) || 'Untitled');
            setContent(cleanText(note.content) || 'No content found.');
          } else {
            setTitle('Note not found');
            setContent('The requested note could not be found.');
          }
        } else {
          setTitle('Error');
          setContent('Could not load the note content.');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setTitle('Error');
        setContent('An error occurred while loading the content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [token, index, navigate]);

  const handleCopy = async () => {
    const textToCopy = `${title}\n\n${content}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The text content has been copied successfully.",
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setIsCopied(true);
        toast({
          title: "Copied to clipboard!",
          description: "The text content has been copied successfully.",
        });
        setTimeout(() => setIsCopied(false), 2000);
      } catch (execError) {
        toast({
          title: "Copy failed",
          description: "Unable to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleBack = () => {
    navigate(`/titles?token=${token}`);
  };

  const handleQRCode = () => {
    navigate('/?showQR=1');
  };

  if (!token || index === null) {
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

        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex-1 min-w-0">
                {isLoading ? (
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                ) : (
                  <span className="truncate">{title}</span>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={isLoading}
                className="ml-3 shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
              </div>
            ) : (
              <div className="bg-accent/50 p-4 rounded-lg min-h-48">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-nunito">
                  {content}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Text;