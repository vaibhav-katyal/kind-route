import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ title, children, onClose, wide = false }) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;

      const controls = dialog.current?.querySelectorAll(
        "button:not(:disabled), input, select, textarea, a[href]",
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () =>
        document
          .querySelector('[role="dialog"] input, [role="dialog"] button')
          ?.focus(),
      50,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-7 py-5">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-7">{children}</div>
      </section>
    </div>
  );
}
