export function MascotDefaultSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={48} height={48} {...props}>
      <title>Node mascot</title>
      <rect x="22" y="25" width="56" height="50" rx="22" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="14" r="5" fill="currentColor">
        <animate attributeName="cy" values="14;12;14" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="26" cy="82" r="5" fill="currentColor">
        <animate attributeName="cx" values="26;27;26" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="82;83;82" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="74" cy="82" r="5" fill="currentColor">
        <animate attributeName="cx" values="74;73;74" dur="4s" repeatCount="indefinite" />
        <animate attributeName="cy" values="82;81;82" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="4" fill="var(--accent, #ff6b2b)" opacity="0.7">
        <animate attributeName="cx" values="50;52;50" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="50;48;50" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function MascotSurprisedSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={48} height={48} {...props}>
      <title>Surprised Node mascot</title>
      <rect x="22" y="25" width="56" height="50" rx="22" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(12 50 50)" />
      <circle cx="54" cy="8" r="5" fill="currentColor">
        <animate attributeName="cy" values="8;6;8" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="cx" values="54;55;54" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="80" r="4" fill="currentColor">
        <animate attributeName="cx" values="20;21;20" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="cy" values="80;81;80" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="76" r="5" fill="currentColor">
        <animate attributeName="cx" values="80;79;80" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="cy" values="76;75;76" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="56" cy="48" r="4" fill="var(--accent, #ff6b2b)" opacity="0.7">
        <animate attributeName="cx" values="56;58;56" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="cy" values="48;46;48" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function MascotThinkingSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={48} height={48} {...props}>
      <title>Thinking Node mascot</title>
      <rect x="22" y="25" width="56" height="50" rx="22" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="14" r="5" fill="currentColor">
        <animate attributeName="cy" values="14;13;14" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="14" cy="50" r="5" fill="var(--accent, #ff6b2b)">
        <animate attributeName="cx" values="14;13;14" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="cy" values="50;51;50" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="26" cy="82" r="5" fill="currentColor">
        <animate attributeName="cx" values="26;27;26" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="cy" values="82;81;82" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="74" cy="82" r="5" fill="currentColor">
        <animate attributeName="cx" values="74;73;74" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="82;83;82" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="10" fill="none" stroke="var(--accent, #ff6b2b)" strokeWidth="2" opacity="0.6">
        <animate attributeName="r" values="10;11;10" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.4;0.6" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="4" fill="var(--accent, #ff6b2b)" opacity="0.8">
        <animate attributeName="cx" values="50;51;50" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="cy" values="50;49;50" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
