resource "aws_iam_role" "iam_role_lambda_cognigy_escalation" {
  name = "RoleForLamdaCognigyEscalation"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

}

resource "aws_iam_policy" "lambda_cloudwatch" {
  name        = "PolicyForCloudwatch"
  path        = "/"
  description = "Policy to allow Lambda to write to Cloudwatch on each invokation"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        "Sid" : "AllowLambdaLogging",
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : "arn:aws:logs:${var.environment.region}:${var.environment.account_id}:log-group:/aws/lambda/${aws_lambda_function.lambda_cognigy_escalation.function_name}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_connect" {
  role       = aws_iam_role.iam_role_lambda_cognigy_escalation.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonConnect_FullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_cloudwatch" {
  role       = aws_iam_role.iam_role_lambda_cognigy_escalation.name
  policy_arn = aws_iam_policy.lambda_cloudwatch.arn
}