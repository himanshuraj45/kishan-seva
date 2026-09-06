/**
 * @file src/components/layout/GoogleTranslateWidget.tsx
 * @description Embeds the Google Translate language picker widget into the top navbar for on-the-fly UI translation.
 */
"use client";

import React, { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const GoogleTranslateWidget = ({ className = "" }: { className?: string }) => {
  useEffect(() => {
    // Function to initialize or re-initialize the widget
    const initWidget = () => {
      if (window.google?.translate?.TranslateElement) {
        // Clear any existing content in our div
        const el = document.getElementById("google_translate_element");
        if (el) el.innerHTML = "";
        
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,bn,te,ta,mr,gu,kn,ml,pa,or,es,fr,ar",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    // Set the global callback for when the script first loads
    window.googleTranslateElementInit = initWidget;

    // If the script is already loaded (e.g. from navigating between pages), manually re-init
    if (window.google?.translate?.TranslateElement) {
      initWidget();
    }
  }, []);

  return (
    <>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
      />
      <div 
        id="google_translate_element"
        className={`inline-block overflow-hidden ${className}`}
        style={{ minHeight: '38px', minWidth: '130px' }}
      ></div>
    </>
  );
};

export default GoogleTranslateWidget;

