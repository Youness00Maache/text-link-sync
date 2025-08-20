import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Send as SendIcon, ArrowLeft, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Send = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const originalText = searchParams.get('originalText') || '';
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendToPhone = async () => {
    if (!token || !title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const newText = `${title}\n\n${content}`;
      // Combine original text with new text
      const combinedText = originalText ? `${originalText}\n\n\n\n${newText}` : newText;
      const success = await api.sendToPhone(token, combinedText);
      if (success) {
        toast({
          title: "Text sent successfully!",
          description: "Your message has been sent to your phone.",
        });
        setTitle('');
        setContent('');
        // Stay on send page instead of navigating away
      } else {
        toast({
          title: "Failed to send",
          description: "There was an error sending your text. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (token) {
      navigate(`/titles?token=${token}`);
    } else {
      navigate('/');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                You need a valid connection to send text to your phone
              </p>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="mt-4"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Send to Phone</h1>
        </div>

        {/* Send Form */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendIcon className="h-5 w-5" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                disabled={isSending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your message..."
                className="min-h-32 resize-none"
                disabled={isSending}
              />
            </div>

            <Button
              onClick={handleSendToPhone}
              disabled={!title.trim() || !content.trim() || isSending}
              variant="success"
              size="lg"
              className="w-full"
            >
              <SendIcon className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send to Phone'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Send;