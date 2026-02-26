// Lambda runtime: Node.js 20.x
import { ConnectClient, StartChatContactCommand } from "@aws-sdk/client-connect";
import { ConnectParticipantClient, CreateParticipantConnectionCommand, SendMessageCommand } from "@aws-sdk/client-connectparticipant"
import crypto from "crypto";

const connectClient = new ConnectClient({ region: "ap-southeast-1" });
const participantClient = new ConnectParticipantClient({ region: "ap-southeast-1" });
function jsonResponse(statusCode, bodyObj, origin) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Add CORS only if you need browser access (often unnecessary if only Cognigy calls it server-to-server)
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization";
    headers["Access-Control-Allow-Methods"] = "POST,OPTIONS";
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(bodyObj),
  };
}

export const handler = async (event) => {
  console.log(JSON.stringify(event))
  const allowedOrigin = process.env.ALLOWED_ORIGIN; // e.g. https://your-domain
  const reqOrigin = event?.headers?.origin || event?.headers?.Origin;

  // Optional: handle preflight if you enabled CORS on the API
  if (event.requestContext?.http?.method === "OPTIONS") {
    return jsonResponse(204, {}, allowedOrigin || reqOrigin);
  }

  let body =event
  /*try {
    body = event ? JSON.parse(event) : {};
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" }, allowedOrigin || reqOrigin);
  }*/

  const instanceId = process.env.CONNECT_INSTANCE_ID;
  const contactFlowId = process.env.CONNECT_CONTACT_FLOW_ID;
  if (!instanceId || !contactFlowId) {
    return jsonResponse(
      500,
      { error: "Missing CONNECT_INSTANCE_ID or CONNECT_CONTACT_FLOW_ID env vars" },
      allowedOrigin || reqOrigin
    );
  }

  // Inputs from Cognigy transformer
  const displayName = body.userId || "Cognigy User";
  const attributes = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
  const initialMessage = body.initialMessage; // { contentType, content } or string
  const clientToken = body.clientToken || crypto.randomUUID(); // idempotency token

  // StartChatContact requires ParticipantDetails.DisplayName and the two IDs. :contentReference[oaicite:5]{index=5}
  const cmdInput = {
    InstanceId: instanceId,
    ContactFlowId: contactFlowId,
    ClientToken: clientToken,
    Attributes: attributes,
    ParticipantDetails: { DisplayName: displayName },

    // Optional initial message
    ...(initialMessage
      ? {
        InitialMessage:
          typeof initialMessage === "string"
            ? { ContentType: "text/plain", Content: initialMessage }
            : {
              ContentType: initialMessage.contentType || "text/plain",
              Content: initialMessage.content || "",
            },
      }
      : {}),

    // Optional but often helpful: declare content types; must include text/plain. :contentReference[oaicite:6]{index=6}
    SupportedMessagingContentTypes: ["text/plain", "text/markdown", "application/json"],
  };

  try {
    const result = await connectClient.send(new StartChatContactCommand(cmdInput));

    // Returns ContactId, ParticipantId, ParticipantToken. :contentReference[oaicite:7]{index=7}
    const participantToken = result.ParticipantToken
    const contactId = result.ContactId
    const participantId = result.ParticipantId
    const input = { // CreateParticipantConnectionRequest
      Type: [ // ConnectionTypeList
        "CONNECTION_CREDENTIALS"
      ],
      ParticipantToken: participantToken, // required
      //ConnectParticipant: true
    };
    //console.log(input)
    const participantCommand = new CreateParticipantConnectionCommand(input);
    const response = await participantClient.send(participantCommand);
    console.log(response)
    //const wssUrl = response.Websocket.Url
    const connectionToken = response.ConnectionCredentials.ConnectionToken
    const chatInput = { // SendMessageRequest
      ContentType: "text/plain", // required
      Content: "Hello, how are you", // required
      ClientToken: clientToken,
      ConnectionToken: connectionToken // required
    };
    //console.log(chatInput)
    const sendChatCommand = new SendMessageCommand(chatInput);
    const sendChatResponse = await participantClient.send(sendChatCommand);
    console.log(sendChatResponse)
    return jsonResponse(
      200,
      {
        contactId: contactId,
        participantId: participantId,
        participantToken: participantToken,
        ConnectionToken: connectionToken,
        //wssUrl: wssUrl
        // continuedFromContactId: result.ContinuedFromContactId // only for persistent chat
      },
      allowedOrigin || reqOrigin
    );
  } catch (err) {
    // StartChatContact can throw 400/404/429/500 types; keep response safe
    return jsonResponse(
      500,
      {
        error: "StartChatContact failed",
        message: err?.message || String(err),
        name: err?.name,
      },
      allowedOrigin || reqOrigin
    );
  }
};