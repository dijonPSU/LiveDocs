import React, { useEffect } from "react";
const toastDuration = 2500; // 2.5 seconds

const Toast = ({ message, onClose, duration = toastDuration }) => {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(onClose, duration);
    return () => clearTimeout(timeout);
  }, [message, onClose, duration]);
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        background: "#2d3748",
        color: "#fff",
        padding: "14px 24px",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
        fontWeight: "bold",
        fontSize: 16,
        opacity: 0.95,
        transition: "opacity 0.3s",
      }}
    >
      {message}
    </div>
  );
};

export default Toast;
