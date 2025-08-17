import logoImage from "@/assets/logo.png";

interface TextLinkerLogoProps {
  className?: string;
}

export const TextLinkerLogo = ({ className = "" }: TextLinkerLogoProps) => {
  return (
    <img 
      src={logoImage} 
      alt="TextLinker" 
      className={`h-12 w-auto ${className}`}
    />
  );
};