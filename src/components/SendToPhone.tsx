import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Send, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface SendToPhoneProps {
  token: string | null;
  className?: string;
}

export const SendToPhone = ({ token, className = "" }: SendToPhoneProps) => {
  const [textToSend, setTextToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendToPhone = async () => {
    if (!token || !textToSend.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter text and ensure you have a valid connection token.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const success = await api.sendToPhone(token, textToSend);
      if (success) {
        toast({
          title: "Text sent successfully!",
          description: "Your message has been sent to your phone.",
        });
        setTextToSend(''); // Clear the textarea after successful send
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

  if (!token) {
    return (
      <Card className={`${className} card-shadow-soft`}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Generate a QR code first to enable sending text to your phone
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} card-shadow-soft`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send to Phone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={textToSend}
          onChange={(e) => setTextToSend(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-32 resize-none"
          disabled={isSending}
        />
        <Button
          onClick={handleSendToPhone}
          disabled={!textToSend.trim() || isSending}
          variant="success"
          size="lg"
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send to Phone'}
        </Button>
      </CardContent>
    </Card>
  );
};