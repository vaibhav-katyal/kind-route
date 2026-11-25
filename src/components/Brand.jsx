export default function Brand({ size = "default" }) {
  const isSmall = size === "sm";
  return (
    <div
      className="flex items-center gap-2.5"
      aria-label="KindRoute"
    >
      <div
        className="brand-icon flex-shrink-0"
        aria-hidden="true"
      >
        <svg
          width={isSmall ? "16" : "18"}
          height={isSmall ? "16" : "18"}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 17.5C10 17.5 2.5 12.5 2.5 7.5C2.5 5.01 4.51 3 7 3C8.37 3 9.6 3.6 10.44 4.56L10 5C10 5 10.56 4.56 10.56 4.56C11.4 3.6 12.63 3 14 3C16.49 3 18.5 5.01 18.5 7.5C18.5 12.5 11 17.5 11 17.5"
            stroke="#8FBB98"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M10 17C6 14 3.5 11 3.5 7.5"
            stroke="rgba(143, 187, 152, 0.4)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="3 3"
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: isSmall ? "14px" : "15px",
          fontWeight: 600,
          letterSpacing: "-0.5px",
          color: "#1B3A2F",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        KindRoute
      </span>
    </div>
  );
}
