export default function Badge({ status }) {
  const map = {
    Available:        ["status status-available", "Available"],
    "Pickup scheduled": ["status status-pickup",    "Pickup scheduled"],
    Delivered:        ["status status-delivered",   "Delivered"],
  };
  const [className, label] = map[status] ?? ["status", status];

  return (
    <span className={className}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
