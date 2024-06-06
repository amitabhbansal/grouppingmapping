import React from "react";
import { Button } from "@itwin/itwinui-react";

const MyCustomButton = () => {
  const handleButtonClick = () => {
    // Define what happens when the button is clicked
    console.log("Button clicked!");
  };

  return <Button onClick={handleButtonClick}>Click Me!</Button>;
};

export default MyCustomButton;
