interface TextLinkerLogoProps {
  className?: string;
}

export const TextLinkerLogo = ({ className = "" }: TextLinkerLogoProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Replace this with your actual logo image when provided */}
      <img 
        src="/src/assets/textlinker-logo.png" 
        alt="TextLinker" 
        className="h-8 w-auto object-contain"
        onError={(e) => {
          // Fallback to text logo if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden flex items-center gap-2 text-foreground">
        <div className="flex flex-col gap-0.5">
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
        </div>
        <span className="text-2xl font-bold tracking-tight">TextLinker</span>
      </div>
    </div>
  );
};