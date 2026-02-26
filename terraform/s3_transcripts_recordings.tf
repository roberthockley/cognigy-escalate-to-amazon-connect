resource "aws_s3_bucket" "transcripts" {
  bucket = "${var.connect.instance}-connect-recordings-transcripts"
}

resource "aws_s3_bucket" "q" {
  bucket = "${var.connect.instance}-connect-amazonq"
}