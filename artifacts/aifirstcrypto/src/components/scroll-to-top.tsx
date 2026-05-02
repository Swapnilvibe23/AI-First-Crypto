import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollUp}
      aria-label="Back to top"
      className={`fixed bottom-6 right-5 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
