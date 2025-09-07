import { AlertCircle, Server, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ServerInstructions = () => {
  return (
    <Card className="card-shadow-soft mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5" />
          Connect Your Server
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connected to <strong>api.textlinker.pro</strong> server. Your app is ready to share text with your phone!
          </AlertDescription>
        </Alert>
        
        <div className="bg-success/10 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm font-medium">Active Features</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• QR code generation ✓</li>
            <li>• Send text to phone ✓</li>
            <li>• Receive text from phone ✓</li>
            <li>• Real-time sync ✓</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};