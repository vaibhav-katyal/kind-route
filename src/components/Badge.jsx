export default function Badge({ status }) {
  return (
    <span
      className={`status ${status === "Delivered" ? "status-delivered" : status === "Available" ? "status-available" : "status-pickup"}`}
    >
      <i />
      {status}
    </span>
  );
}
