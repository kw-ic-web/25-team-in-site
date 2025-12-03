import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = import.meta.env.VITE_GA_ID || "G-D1LXFSK2NT";

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    const gtag = (window as any).gtag;
    if (!GA_ID || !gtag) return;

    gtag("config", GA_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
