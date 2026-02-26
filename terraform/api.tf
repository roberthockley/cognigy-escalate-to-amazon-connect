resource "aws_api_gateway_rest_api" "cognigy_escalation" {
  api_key_source               = "HEADER"
  description                  = "cognigy_escalation"
  disable_execute_api_endpoint = "false"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  name = "cognigy_escalation"
}

resource "aws_api_gateway_rest_api_policy" "cognigy_escalation" {
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Principal = "*",
        Action    = "execute-api:Invoke",
        Effect    = "Allow",
        Resource  = "arn:aws:execute-api:ap-southeast-1:${var.environment.account_id}:*/*"
      }
    ]
  })
}

resource "aws_api_gateway_method" "cognigy_escalation_options" {
  api_key_required = "false"
  authorization    = "NONE"
  http_method      = "OPTIONS"
  resource_id      = aws_api_gateway_resource.cognigy_escalation.id
  rest_api_id      = aws_api_gateway_rest_api.cognigy_escalation.id
}

resource "aws_api_gateway_method" "cognigy_escalation_post" {
  api_key_required = "false"
  authorization    = "NONE"
  http_method      = "POST"
  resource_id      = aws_api_gateway_resource.cognigy_escalation.id
  rest_api_id      = aws_api_gateway_rest_api.cognigy_escalation.id
}

resource "aws_api_gateway_method_response" "cognigy_escalation_options" {
  depends_on  = [aws_api_gateway_method.cognigy_escalation_options]
  http_method = "OPTIONS"
  resource_id = aws_api_gateway_resource.cognigy_escalation.id
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "true"
    "method.response.header.Access-Control-Allow-Methods" = "true"
    "method.response.header.Access-Control-Allow-Origin"  = "true"
  }
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
  status_code = "200"
}

resource "aws_api_gateway_method_response" "cognigy_escalation_post" {
  depends_on  = [aws_api_gateway_method.cognigy_escalation_post]
  http_method = "POST"
  resource_id = aws_api_gateway_resource.cognigy_escalation.id
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "true"
  }
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
  status_code = "200"
}

resource "aws_api_gateway_resource" "cognigy_escalation" {
  parent_id   = aws_api_gateway_rest_api.cognigy_escalation.root_resource_id
  path_part   = "connect"
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
}

resource "aws_api_gateway_integration" "cognigy_escalation_options" {
  depends_on = [ aws_api_gateway_method.cognigy_escalation_options ]
  cache_namespace      = aws_api_gateway_resource.cognigy_escalation.id
  connection_type      = "INTERNET"
  http_method          = "OPTIONS"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
  resource_id          = aws_api_gateway_resource.cognigy_escalation.id
  rest_api_id          = aws_api_gateway_rest_api.cognigy_escalation.id
  timeout_milliseconds = "29000"
  type                 = "MOCK"
}

resource "aws_api_gateway_integration" "cognigy_escalation_post" {
  depends_on              = [aws_api_gateway_method.cognigy_escalation_post, aws_api_gateway_method.cognigy_escalation_options]
  cache_namespace         = aws_api_gateway_resource.cognigy_escalation.id
  connection_type         = "INTERNET"
  content_handling        = "CONVERT_TO_TEXT"
  http_method             = "POST"
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
  resource_id             = aws_api_gateway_resource.cognigy_escalation.id
  rest_api_id             = aws_api_gateway_rest_api.cognigy_escalation.id
  timeout_milliseconds    = "29000"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-1:${var.environment.account_id}:function:${aws_lambda_function.lambda_cognigy_escalation.function_name}/invocations"
}

resource "aws_api_gateway_integration_response" "cognigy_escalation_options" {
  depends_on  = [aws_api_gateway_integration.cognigy_escalation_options]
  http_method = "OPTIONS"
  resource_id = aws_api_gateway_resource.cognigy_escalation.id
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "cognigy_escalation_post" {
  depends_on  = [aws_api_gateway_integration.cognigy_escalation_post]
  http_method = "POST"
  resource_id = aws_api_gateway_resource.cognigy_escalation.id
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id
  status_code = "200"
}

resource "aws_api_gateway_stage" "cognigy_escalation" {
  cache_cluster_enabled = "false"
  deployment_id         = aws_api_gateway_deployment.call_service_api_deployment.id
  rest_api_id           = aws_api_gateway_rest_api.cognigy_escalation.id
  stage_name            = "cognigy_escalation"
  xray_tracing_enabled  = "false"
}

resource "aws_lambda_permission" "cognigy_escalation" {
  statement_id  = "AllowAPIGatewayInvoke_cognigy_escalation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_cognigy_escalation.function_name
  principal     = "apigateway.amazonaws.com" # For API Gateway
  # Define the source ARN for your API Gateway
  source_arn = "${aws_api_gateway_rest_api.cognigy_escalation.execution_arn}/*/*/*"
}

resource "aws_api_gateway_gateway_response" "cognigy_escalation_4xx" {
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST'"
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = "{\"message\":$context.error.messageString}"
  }

  response_type = "DEFAULT_4XX"
  rest_api_id   = aws_api_gateway_rest_api.cognigy_escalation.id
}

resource "aws_api_gateway_gateway_response" "cognigy_escalation_5xx" {
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST'"
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = "{\"message\":$context.error.messageString}"
  }

  response_type = "DEFAULT_5XX"
  rest_api_id   = aws_api_gateway_rest_api.cognigy_escalation.id
}

resource "aws_api_gateway_deployment" "call_service_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.cognigy_escalation.id

  # triggers is arbitrary map; changing any value forces a new deployment
  triggers = {
    redeployment = sha1(
      join("", [
        aws_api_gateway_integration.cognigy_escalation_post.id,
        aws_api_gateway_integration.cognigy_escalation_options.id,
        aws_api_gateway_method.cognigy_escalation_post.id,
        aws_api_gateway_method.cognigy_escalation_options.id,
        # you can include other values that indicate API changes, e.g. lambda hash if available:
        # aws_lambda_function.lambda_cognigy_escalation.source_code_hash
      ])
    )
  }

  lifecycle {
    create_before_destroy = true
  }

  # optional: a meaningful description
  description = "Automated deployment from Terraform - ${timestamp()}"
}
