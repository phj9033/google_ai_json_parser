import React, { useEffect, useRef } from 'react';

// Add PartnersCoupang to the window object for TypeScript
declare global {
  interface Window {
    PartnersCoupang: any;
  }
}

const CoupangAd: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adContainerRef.current;
    // Prevent re-injecting the script if it already exists
    if (!container || container.querySelector('script')) {
      return;
    }

    const externalScript = document.createElement('script');
    externalScript.src = 'https://ads-partners.coupang.com/g.js';
    externalScript.async = true;

    externalScript.onload = () => {
      // Check if the component is still mounted and the script has loaded
      if (window.PartnersCoupang && adContainerRef.current) {
        const inlineScript = document.createElement('script');
        inlineScript.innerHTML = `
          new window.PartnersCoupang.G({
            "id": 917906,
            "template": "carousel",
            "trackingCode": "AF6476560",
            "width": "680",
            "height": "140",
            "tsource": ""
          });
        `;
        adContainerRef.current.appendChild(inlineScript);
      }
    };

    container.appendChild(externalScript);

    // Cleanup function to remove scripts and ad content on unmount
    return () => {
        if (container) {
            container.innerHTML = '';
        }
    }
  }, []);

  return (
    // This container uses `flex-col-reverse`. This CSS rule reverses the visual order of elements.
    // The first element in the code appears last on the screen, and the last appears first.
    <div className="bg-gray-800 py-2 flex flex-col-reverse items-center gap-2">
      {/* 
        The disclaimer text is placed FIRST in the code. Because of `flex-col-reverse`, it will
        appear LAST (at the bottom) on the screen. This ensures it's always below the ad.
      */}
      <p className="text-xs text-gray-200 text-center px-4">
        이 포스팅은 쿠팡 파트너스 활동으로 수익을 받을 수 있습니다
      </p>

      {/* 
        The ad container is placed LAST in the code. Because of `flex-col-reverse`, it will
        appear FIRST (at the top) on the screen. This is a very robust way to control ordering
        when external scripts might interfere.
      */}
      <div
        ref={adContainerRef}
        className="w-full min-h-[2px]"
        aria-live="polite"
      />
    </div>
  );
};

export default CoupangAd;