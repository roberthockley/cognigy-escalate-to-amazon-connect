import React from "react";
import CognigyWebchatClone from "./components/CognigyWebchatClone";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";

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
                    "url('https://scontent.fsin12-1.fna.fbcdn.net/v/t39.30808-6/481143629_672508295103208_928336719418231576_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=P9qxBMr5QiMQ7kNvwHteZ8L&_nc_oc=Adl7HF5o28ED6oyliPbi56v5gJCOvpAIrds7rvnSj7kR4WTK2aZtirsuWZ7leitgIMU&_nc_zt=23&_nc_ht=scontent.fsin12-1.fna&_nc_gid=FHFbMohamSJJzSl7WrvkVQ&oh=00_Afs7Lteoo81t-0UfQvc08heTG5wWgoA7xuI-ruySi_u64Q&oe=698788E4')",
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
