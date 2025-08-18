import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
            
            {token && (
              <Button
                onClick={goToTitles}
                variant="outline"
                size="lg"
                className="w-full mt-4"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Your Texts
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Send to Phone - Only show after QR is generated and scanned */}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Card className="card-shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-medium text-sm mb-1">From Phone</h3>
              <p className="text-xs text-muted-foreground">
                Scan QR code to send text from your mobile app
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">💻</div>
              <h3 className="font-medium text-sm mb-1">To Phone</h3>
              <p className="text-xs text-muted-foreground">
                Type here to send text directly to your phone
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Server Setup Instructions */}
        <ServerInstructions />
      </div>
    </div>
  );
};

export default Home;