import React from "react";
import CognigyWebchatClone from "./components/CognigyWebchatClone";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import GNB from "./GNB.jpg"

function App() {
  const [startChat, setStartChat] = React.useState(false);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa"
      }}
    >
      <div style={{ width: "300pt" }}>
        {startChat ? (
          <CognigyWebchatClone
            endpointUrl={process.env.REACT_APP_ENDPOINTURL}
            urlToken={process.env.REACT_APP_URLTOKEN}
            user={{
              id: "Geoffrey",
              name: "Robert",
              metadata: { plan: "gold" }
            }}
          />
        ) : (
          <Container
            header={
              <Header
                variant="h2"
                description="Hi, I'm Sophie from Goliath National Bank. How can I help you today?"
              >
              </Header>
            }
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "320px"
              }}
            >
              {/* Watermark area */}
              <div
                style={{
                  flex: 1,
                  backgroundImage:
                    `url(${GNB})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "contain",
                  opacity: 1
                }}
              />

              {/* Footer button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "16px"
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => setStartChat(true)}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </Container>


        )}
      </div>
    </div>
  );
}

export default App;
