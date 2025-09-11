import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { SendToPhone } from '@/components/SendToPhone';
import { ServerInstructions } from '@/components/ServerInstructions';
import { TextLinkerLogo } from '@/components/TextLinkerLogo';
import { FileText } from 'lucide-react';

const Home = () => {
  const [token, setToken] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-generate QR code if showQR=1 is in URL
  useEffect(() => {
    if (searchParams.get('showQR') === '1') {
      // Trigger QR code generation automatically
      // This is handled by the QRCodeGenerator component
    }
  }, [searchParams]);

  const handleTokenGenerated = (newToken: string) => {
    setToken(newToken);
  };

  const goToTitles = () => {
    if (token) {
      navigate(`/titles?token=${token}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <TextLinkerLogo className="mx-auto mb-8 h-16" />
        </div>

        {/* QR Code Generation */}
        <Card className="card-shadow">
          <CardContent className="p-6">
            <QRCodeGenerator 
              onTokenGenerated={handleTokenGenerated}
              autoGenerate={searchParams.get('showQR') === '1'}
            />
          </CardContent>
        </Card>

        {/* Privacy Policy Link */}
        <div className="text-center mt-8">
          <Link 
            to="/privacy" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Privacy Policy
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;