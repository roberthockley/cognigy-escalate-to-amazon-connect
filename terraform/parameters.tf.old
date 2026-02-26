resource "aws_ssm_parameter" "outage" {
  name        = "outages"
  description = "Demo Outages"
  type        = "String"
  value       = file("./outages.json")
}
