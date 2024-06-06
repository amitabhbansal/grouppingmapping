import React from "react";
import { toaster, Button } from "@itwin/itwinui-react";
import CopyIcon from "./CopyIcon";

interface CustomToasterProps {
  title: string;
  message: string;
}

const CustomToaster: React.FC<CustomToasterProps> = ({ title, message }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toaster.positive("Message copied to clipboard");
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>{title}</h3>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ margin: "0", fontSize: "16px", marginRight: "16px" }}>
          {message}
        </p>
        <Button
          onClick={handleCopy}
          //startIcon={<CopyIcon />}
          style={{ background: "#0078d4", color: "#fff", fontWeight: "bold" }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
};

export default CustomToaster;
