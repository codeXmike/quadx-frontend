function Icon({ name, size = 16, strokeWidth = 1.9, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `icon ${className}`.trim(),
    "aria-hidden": true
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "friends":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 20c0-3 2.6-5 5.5-5s5.5 2 5.5 5" />
          <path d="M14 20c.2-1.8 1.7-3.4 3.8-4" />
        </svg>
      );
    case "game":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="M8 10v4M6 12h4" />
          <circle cx="16" cy="11" r="1" />
          <circle cx="18" cy="13" r="1" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v3a4 4 0 0 1-8 0z" />
          <path d="M10 14h4M12 10v4M9 20h6" />
          <path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h0a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h0a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v0a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
        </svg>
      );
    case "zap":
      return (
        <svg {...common}>
          <path d="M13 2 5 13h6l-1 9 8-11h-6z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="m3 9 4.5 4L12 7l4.5 6L21 9l-2 10H5z" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M15 18 9 12l6-6" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 0 2 5.3" />
          <path d="M22 4v7h-7" />
        </svg>
      );
    case "medal-1":
    case "medal-2":
    case "medal-3":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="5" />
          <path d="M9 3h6l-1.5 6h-3z" />
        </svg>
      );
    default:
      return null;
  }
}

export default Icon;
