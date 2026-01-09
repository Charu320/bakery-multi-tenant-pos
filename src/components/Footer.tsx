import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container flex items-center justify-center gap-2 mx-auto text-sm text-muted-foreground">
        <span>Crafted with</span>
        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
        <span>by Software Developer -</span>
        <span className="font-medium text-gold">Charu Pulani</span>
      </div>
    </footer>
  );
};
