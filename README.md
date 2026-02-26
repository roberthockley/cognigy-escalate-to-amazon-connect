Introduction

This project demonstrates an end-to-end integration between Cognigy AI and Amazon Connect, enabling seamless escalation from an automated chatbot to a live agent within a unified customer experience.  The solution provisions the required AWS infrastructure using Terraform — including Amazon Connect, API Gateway, Lambda, IAM, and supporting services — and provides both a React-based customer webchat and an Amazon Connect third-party agent application. Together, these components allow bot-driven conversations to transition smoothly to live agents while preserving full transcript history, context, sentiment, and escalation metadata. The result is a production-ready reference architecture for intelligent chatbot-to-agent handover using modern, infrastructure-as-code best practices.

![Cognigy Escalation to Amazon Conenct via Chat](/cognigytoamazon.png)

# Prerequisites
Before deploying this Terraform configuration, ensure you have the following installed and configured:

**Terraform**

Terraform CLI (recommended version: 1.5+)  

Verify installation: 

    terraform version  

Installation instructions are available on the official Terraform website.

**AWS CLI**

AWS CLI v2 installed  

Configured with credentials that have permission to create:
- Amazon Connect resources
- API Gateway
- Lambda
- IAM roles and policies
- S3 buckets
- CloudWatch log groups

Verify configuration:  

    aws sts get-caller-identity

Installation and configuration instructions are available on the official AWS documentation site.

**AWS Permissions**

The AWS credentials used must have sufficient permissions to:  
- Create and manage Amazon Connect instances and flows
- Create Lambda functions and layers
- Create API Gateway APIs and integrations
- Create IAM roles and attach policies
- Create S3 buckets
- Create CloudWatch log groups

**Node.js**

**NPM**

Verify installation:

        node -v
        npm -v

# Terraform
Below is a concise inventory list of what the Terraform deployment created.  
This list intentionally omits any ARNs, IDs, names, URLs, or other concrete values — it only lists the services, resources and logical components that were installed and wired together.  

## Core AWS services
- Amazon Connect instance
- Amazon API Gateway (REST API + stage + deployment)
- AWS Lambda function(s)
- AWS Lambda Layer(s)
- Amazon S3 buckets (for recordings, transcripts, attachments, reports, etc.)
- Amazon CloudWatch Log Group(s)
- AWS IAM Role(s) and IAM Policy/Policy Attachments
- Amazon Connect configuration

## Amazon Connect Configuration:
- Inbound contact flow
- Customer queue flow
- Disconnect flow
- Outbound whisper flow (used for outbound calls)
- Queue(s) (e.g., sales/customer queues)
- Hours of operation configuration

## Instance storage configurations for:
- Call recordings
- Chat transcripts
- Attachments
- Contact evaluations
- Scheduled reports
- Screen recordings

## API Gateway configuration
REST API with a resource (e.g., /connect)  
Methods:  
- POST (integration with Lambda)
- OPTIONS (CORS / mock integration)
- Integration(s) linking API Gateway to Lambda
-  Deployment and Stage (to expose an invoke URL)
-  Gateway responses configured for 4xx/5xx with CORS headers

## Lambda / runtime wiring
Lambda function deployed (with environment variables pointing to Connect instance/flows)  
Lambda Layer providing shared code/dependencies  
Lambda permission allowing API Gateway to invoke the function  
CloudWatch logging for the Lambda function  

## IAM
IAM Role for Lambda with attached policies  
Policy for CloudWatch logging  
Managed policy granting Amazon Connect access (used by the Lambda role)  

## Terraform Variables

1. Copy the example file:

   cp terraform.tfvars.example terraform.tfvars

2. Edit `terraform.tfvars` and provide real values for:
   - AWS account ID
   - Region
   - Connect instance name
   - Flow names and greetings

3. Run:

        terraform init
        terraform plan
        terraform apply

## Terraform Output

Terraform will output the value for the **URL** for **api_gateway** which is needed for the **Cognigy Webchat Widget**

# Cognigy Webchat Widget (React)

![Cognigy Webchat Widget](/chat.png)

The React application acts as the chat interface for Cognigy.  
It:
- Connects to Cognigy via WebSocket (Socket.IO)
- Sends and receives messages
- Displays bot responses
- Detects escalation triggers from Cognigy
- Initiates handover to Amazon Connect
- Establishes a live agent session via Amazon Connect ChatJS
- Routes messages between:
- Cognigy (bot mode)
- Amazon Connect (agent mode)
- Automatically returns to Cognigy after agent disconnect
- Maintains a local transcript
- Allows transcript download
- Supports embedded page rendering from Cognigy payloads

In short: 
The React app is the conversational frontend and orchestration layer between Cognigy and Amazon Connect.

## Installing Dependencies

From the React project directory:

        npm install

This installs all required packages, including:

- React
- @cognigy/socket-client
- Amazon Connect ChatJS (via script)
- Cloudscape UI components

## Updating the Environment Variables

The React application requires environment variables to connect to:

- Cognigy
- Amazon Connect (via API Gateway)
- AWS region configuration

An example file is provided:

        .env-example

Copy the example file:

        cp .env-example .env

Open **.env** and replace the placeholder values:

        REACT_APP_ENDPOINTURL=https://your-cognigy-endpoint
        REACT_APP_URLTOKEN=your-cognigy-url-token
        REACT_APP_STARTCHATURL=https://your-api-gateway-url
        REACT_APP_AWSREGION=ap-southeast-1

## Running Locally (Development Mode)

        npm start

This:

- Starts a local development server
- Enables hot reload
- Typically runs at http://localhost:3000

## Building for Production

        npm run build

This:

- Creates an optimized production build
- Outputs static files to the build/ directory

Can be deployed to:

- S3 + CloudFront
- Nginx
- Any static hosting platform

## Amazon Connect Third-Party App (Agent Desktop)

This solution includes an Amazon Connect third-party app that runs inside the Amazon Connect agent workspace to give agents immediate context when a Cognigy chat is escalated.

What it’s used for

When a customer conversation is handed over from Cognigy (bot) to Amazon Connect (live agent), the React webchat sends metadata (including the conversation transcript and escalation context) into Amazon Connect contact attributes. This third-party app reads those attributes and presents them in a structured, agent-friendly UI.

**Key capabilities:**

- Transcript viewer
- Displays the full Cognigy transcript for the current contact.
- Supports both “legacy markdown transcript” and the newer JSON-array transcript format (the app normalizes JSON → markdown, then parses it into turns).
- Search & navigation
- Keyword search across the transcript.
- Highlights matches.
- Next/previous navigation through search results.
- Automatically scrolls to the currently selected match.
- Sentiment + escalation context
- Displays sentiment and escalation “reason/summary” (when provided).
- Provides a simple “Summary, Sentiment & Next Steps” panel so agents can quickly understand why the chat was escalated.

**How it works (high level)**

The app is initialized via the Amazon Connect Apps framework (AmazonConnectApp.init).  
It creates a ContactClient to receive contact lifecycle events.  

On contact connect:

- Retrieves contact attributes (e.g., transcript, sentiment, reason).
- Normalizes + parses transcript into a chat-like display.
- Renders transcript bubbles aligned by speaker (bot/system/agent vs customer).

On ACW (after contact work) start:

- Clears state and resets UI for the next contact.

This app is intended to be the agent-side companion to the customer webchat, ensuring agents have full conversational history and context at the moment of escalation.

## Installing Dependencies

From the React project directory:

        npm install

This installs all required packages, including:

- React
- @cognigy/socket-client
- Amazon Connect ChatJS (via script)
- Cloudscape UI components

## Running Locally (Development Mode)

        npm start

This:

- Starts a local development server
- Enables hot reload
- Typically runs at http://localhost:3000 (will be a different port like 3001 if running )

## Building for Production

        npm run build

This:

- Creates an optimized production build
- Outputs static files to the build/ directory

Can be deployed to:

- S3 + CloudFront
- Nginx
- Any static hosting platform

## Thirdparty App Configuration in Amazon Connect

![Amazon Connect Agent Desktop](/agent_desktop.png)

During development, you can run the third-party app locally and configure Amazon Connect to load it from your machine.

**Prerequisites**

You can run the app locally (it serves a web UI on a local port).  
You can access your Amazon Connect instance admin settings.  
Your browser can reach http://localhost:3001 on the same machine where you are logged into Amazon Connect.  

**High-level setup steps**

Start the app locally so it is available at:

        http://localhost:3001

In Amazon Connect Admin, go to the section for Apps / Third-party applications (naming varies slightly by console/experience).

Register a new third-party app and set the app’s URL to:

        http://localhost:3001

Assign the new Third party App to oyur Amazon Connect instance.  
In Amazon Connect Security Profiles add the app to your user profiles
Create a User
Assign to the Profile you updated
Login as the new User, not the Emergency Access

more information about Third Pary Apps can be found here: [Third Party App Guide](https://docs.aws.amazon.com/connect/latest/adminguide/3p-apps.html)

Important notes:

- Localhost only works for you (your own browser on your machine). Other users won’t be able to load your localhost.
