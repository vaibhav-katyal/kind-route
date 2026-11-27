export default function Brand({ light = false }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${light ? "text-white" : "text-forest"}`}
    >
      <span className="brand-icon overflow-hidden">
        <img
          src="/logo.webp"
          alt="KindRoute logo"
          className="h-full w-full object-contain p-0.5"
        />
      </span>
      <span className="text-[25px] font-bold tracking-[-1px]">
        KindRoute<span className="text-sage">.</span>
      </span>
    </div>
  );
}
