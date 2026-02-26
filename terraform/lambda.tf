resource "aws_cloudwatch_log_group" "lambda_cognigy_escalation" {
  name = "/aws/lambda/${aws_lambda_function.lambda_cognigy_escalation.function_name}"
  retention_in_days = 7
}


resource "aws_lambda_layer_version" "lambda_layer_connect" {
  filename            = "lambda_layer.zip"
  layer_name          = "cognigy_escalation"
  compatible_runtimes = ["nodejs22.x", "nodejs22.x"]
}

resource "aws_lambda_function" "lambda_cognigy_escalation" {
  # If the file is not in the current working directory you will need to include a
  # path.module in the filename.
  filename      = "lambda_cognigy_escalation.zip"
  function_name = "${var.connect.instance}_cognigy_escalation"
  role          = aws_iam_role.iam_role_lambda_cognigy_escalation.arn
  handler       = "index.handler"
  publish       = true
  layers        = [aws_lambda_layer_version.lambda_layer_connect.arn] 
  runtime     = "nodejs22.x"
  memory_size = "512"
  timeout     = "30"
  ephemeral_storage {
    size = 512 # Min 512 MB and the Max 10240 MB
  }
  environment {
    variables = {
      CONNECT_INSTANCE_ID = "${aws_connect_instance.song.id}"
      CONNECT_CONTACT_FLOW_ID = "${aws_connect_contact_flow.inbound_flow.contact_flow_id}"
    }
  }
}