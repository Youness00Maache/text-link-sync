import { ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextLinkerLogo } from './TextLinkerLogo';

interface AppHeaderProps {
  onBack?: () => void;
  onQRCode?: () => void;
  showBackButton?: boolean;
  showQRButton?: boolean;
  className?: string;
}

export const AppHeader = ({ 
  onBack, 
  onQRCode, 
  showBackButton = false, 
  showQRButton = false,
  className = "" 
}: AppHeaderProps) => {
  return (
    <header className={`flex items-center justify-between mb-8 ${className}`}>
      <div className="w-10">
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <TextLinkerLogo />
      
      <div className="w-10">
        {showQRButton && onQRCode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onQRCode}
            className="rounded-full"
          >
            <QrCode className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};