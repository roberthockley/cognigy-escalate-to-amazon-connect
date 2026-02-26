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

## Contact flows:
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