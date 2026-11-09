import React from "react";
import { Info, AlertCircle } from "lucide-react";

interface ApiNoticeProps {
  type?: "info" | "warning";
  title: string;
  message: string;
  endpoint?: string;
}

export const ApiNotice: React.FC<ApiNoticeProps> = ({
  type = "info",
  title,
  message,
  endpoint,
}) => {
  return (
    <div className={`api-notice-banner ${type}`}>
      <div className="api-notice-icon">
        {type === "warning" ? <AlertCircle size={20} /> : <Info size={20} />}
      </div>
      <div className="api-notice-body">
        <strong>{title}</strong>
        <p>{message}</p>
        {endpoint && (
          <code className="api-notice-endpoint">Target Endpoint: {endpoint}</code>
        )}
      </div>
    </div>
  );
};

