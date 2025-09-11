import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    // Redirect to the external privacy page
    window.location.href = "https://textlinker.pro/privacy.html";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirecting to Privacy Policy...</p>
      </div>
    </div>
  );
};

export default Privacy;