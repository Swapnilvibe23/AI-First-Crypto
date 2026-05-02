import { useEffect } from "react";

const DEFAULT_TITLE = "AIFirstCrypto — Your Daily Crypto Snapshot";
const DEFAULT_DESCRIPTION =
  "Live crypto prices, Fear & Greed index, top movers, and the latest news — all in one beginner-friendly dashboard. No login, no noise.";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function useSeoMeta({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="description"]', "content", DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:title"]', "content", DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', "content", DEFAULT_DESCRIPTION);
      setMeta('meta[name="twitter:title"]', "content", DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', "content", DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
