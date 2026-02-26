// src/App.js
import React from "react";
import AmazonConnectWebchatClone from "./components/AmazonConnectWebchatClone";

function App() {
  return (
    <div style={{ padding: 24 }}>
      <AmazonConnectWebchatClone
        startChatUrl="https://d6dfpfkorb.execute-api.ap-southeast-1.amazonaws.com/Prod/connect/start" // POST -> StartChatContact
        user={{
          id: "user-123",
          name: "Robert",
          metadata: {
            plan: "gold"
          }
        }}
      />
    </div>
  );
}

export default App;
