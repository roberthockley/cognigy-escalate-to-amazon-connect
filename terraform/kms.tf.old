resource "aws_kms_key" "amazonq" {
  description             = "Amazon Q KMS key"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  policy = jsonencode({
    "Id" : "key-consolepolicy-3",
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "arn:aws:iam::${var.environment.account_id}:root"
        },
        "Action" : "kms:*",
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "connect.amazonaws.com"
        },
        "Action" : [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_kms_alias" "q" {
  name          = "alias/amazon-q"
  target_key_id = aws_kms_key.amazonq.key_id
}