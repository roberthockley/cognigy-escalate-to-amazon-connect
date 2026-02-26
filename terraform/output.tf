output "api_gateway" {
    value = "${aws_api_gateway_stage.cognigy_escalation.invoke_url}/connect"
}
