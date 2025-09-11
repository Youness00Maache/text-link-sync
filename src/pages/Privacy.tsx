import { AppHeader } from "@/components/AppHeader";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </header>

          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">Overview</h2>
              <p className="leading-relaxed">
                TextLinker is committed to protecting your privacy. This Privacy Policy explains how we collect, use, 
                and safeguard your information when you use our text sharing service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Text Content</h3>
                <p className="leading-relaxed">
                  We temporarily store the text content you share through our service. This text is stored only for 
                  the duration needed to facilitate the transfer between your devices and is automatically deleted 
                  after 10 minutes of inactivity.
                </p>
                
                <h3 className="text-lg font-medium">Usage Data</h3>
                <p className="leading-relaxed">
                  We may collect basic usage information such as connection logs and error reports to improve our 
                  service quality. This data does not include the content of your shared text.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>To facilitate real-time text sharing between your devices</li>
                <li>To maintain and improve our service performance</li>
                <li>To troubleshoot technical issues</li>
                <li>To ensure the security and integrity of our platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Data Storage and Security</h2>
              <p className="leading-relaxed mb-3">
                Your text content is stored temporarily in memory on our servers and is not persisted to permanent 
                storage. We implement industry-standard security measures to protect your data during transmission 
                and temporary storage.
              </p>
              <p className="leading-relaxed">
                All data is automatically purged from our systems within 10 minutes of upload or when the session expires.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
              <p className="leading-relaxed">
                TextLinker may use third-party services for hosting and analytics. These services are chosen for 
                their commitment to data privacy and security. We do not share your text content with any third parties.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>You can stop using our service at any time</li>
                <li>Your data is automatically deleted after 10 minutes</li>
                <li>You can request information about data processing by contacting us</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Children's Privacy</h2>
              <p className="leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page 
                with an updated revision date.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our support channels.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;