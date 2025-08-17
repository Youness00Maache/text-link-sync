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
            Currently running in <strong>demo mode</strong>. To enable full functionality, run your server.js file.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Run your Node.js server</p>
              <code className="text-xs bg-accent px-2 py-1 rounded mt-1 block">
                node server.js
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Update the API configuration</p>
              <p className="text-muted-foreground text-xs mt-1">
                In <code>src/lib/api.ts</code>, set <code>DEMO_MODE = false</code> and update <code>SERVER_URL</code>
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Your mobile app will connect to</p>
              <code className="text-xs bg-accent px-2 py-1 rounded mt-1 block">
                http://localhost:3002
              </code>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm font-medium">Demo Features Available</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• QR code generation ✓</li>
            <li>• Send text to phone (simulated) ✓</li>
            <li>• View sample notes ✓</li>
            <li>• Full UI experience ✓</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};