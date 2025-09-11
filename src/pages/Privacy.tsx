import { AppHeader } from "@/components/AppHeader";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </header>

          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
              <p className="leading-relaxed">
                TextLinker temporarily stores the text content you share through our service. This text is stored only for 
                the duration needed to facilitate the transfer between your devices and is automatically deleted 
                after 10 minutes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>To facilitate real-time text sharing between your devices</li>
                <li>To maintain and improve our service performance</li>
                <li>To ensure the security of our platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
              <p className="leading-relaxed">
                Your text content is stored temporarily in memory and is automatically deleted after 10 minutes. 
                We implement security measures to protect your data during transmission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Contact</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy, please contact us through our support channels.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;