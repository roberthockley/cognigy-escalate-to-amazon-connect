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