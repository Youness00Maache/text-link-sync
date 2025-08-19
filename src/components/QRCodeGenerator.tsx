import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface QRCodeGeneratorProps {
  onTokenGenerated: (token: string) => void;
  autoGenerate?: boolean;
  className?: string;
}

export const QRCodeGenerator = ({ onTokenGenerated, autoGenerate = false, className = "" }: QRCodeGeneratorProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoGenerate) {
      generateQRCode();
    }
  }, [autoGenerate]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const newToken = await api.generateToken();
      setToken(newToken);
      onTokenGenerated(newToken);

      // Create a QR code that points to the titles page with the token
      const fullUrl = `${window.location.origin}/titles?token=${newToken}`;
      
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, fullUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1B1B1B',
            light: '#FFFFFF'
          }
        });
      }

      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1B1B1B',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <Button 
        onClick={generateQRCode}
        variant="textlinker"
        size="lg"
        disabled={isGenerating}
        className="w-full mb-6"
      >
        {isGenerating ? 'Generating...' : 'Generate QR Code'}
      </Button>
      
      {qrDataUrl && (
        <div className="mt-6 p-4 bg-accent rounded-xl card-shadow-soft">
          <div className="bg-white p-4 rounded-lg inline-block">
            <canvas ref={canvasRef} className="hidden" />
            <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Scan this QR code with your phone to start sharing text
          </p>
          
          {/* View Your Texts Button */}
          {token && (
            <div className="mt-4">
              <Button
                onClick={() => navigate(`/titles?token=${token}`)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Your Texts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};