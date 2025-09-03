interface TextLinkerLogoProps {
  className?: string;
}

export const TextLinkerLogo = ({ className = "" }: TextLinkerLogoProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/lovable-uploads/9423ada0-4d2b-4727-a511-f25f60008ea4.png" 
        alt="TextLinker Logo" 
        className="h-12 w-auto"
      />
    </div>
  );
};