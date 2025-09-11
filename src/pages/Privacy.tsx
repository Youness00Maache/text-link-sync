const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
            <p>
              TextLinker temporarily stores the text content you share through our service. 
              This text is automatically deleted after 10 minutes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To facilitate real-time text sharing between your devices</li>
              <li>To maintain and improve our service performance</li>
              <li>To ensure the security of our platform</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p>
              Your text content is stored temporarily in memory and is automatically deleted after 10 minutes. 
              We implement security measures to protect your data during transmission.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through our support channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;