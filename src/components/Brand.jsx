import { HeartHandshake } from "lucide-react";

export default function Brand({ light = false }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${light ? "text-white" : "text-forest"}`}
    >
      <span className="brand-icon">
        <HeartHandshake size={25} strokeWidth={1.7} />
      </span>
      <span className="text-[25px] font-bold tracking-[-1px]">
        KindRoute<span className="text-sage">.</span>
      </span>
    </div>
  );
}
