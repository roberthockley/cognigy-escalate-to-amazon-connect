resource "aws_connect_instance" "song" {
  identity_management_type         = "CONNECT_MANAGED"
  inbound_calls_enabled            = true
  instance_alias                   = var.connect.instance
  outbound_calls_enabled           = true
  contact_lens_enabled             = false
  contact_flow_logs_enabled        = true
  auto_resolve_best_voices_enabled = true
}

resource "aws_connect_instance_storage_config" "transcripts" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "CHAT_TRANSCRIPTS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "transcripts"
    }
    storage_type = "S3"
  }
}


resource "aws_connect_instance_storage_config" "recordings" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "CALL_RECORDINGS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "recordings"
    }
    storage_type = "S3"
  }
}

resource "aws_connect_instance_storage_config" "reports" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "SCHEDULED_REPORTS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "reports"
    }
    storage_type = "S3"
  }
}


resource "aws_connect_instance_storage_config" "attachments" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "ATTACHMENTS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "attachments"
    }
    storage_type = "S3"
  }
}

resource "aws_connect_instance_storage_config" "screen" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "SCREEN_RECORDINGS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "screen_recordings"
    }
    storage_type = "S3"
  }
}

resource "aws_connect_instance_storage_config" "evaluations" {
  instance_id   = aws_connect_instance.song.id
  resource_type = "CONTACT_EVALUATIONS"

  storage_config {
    s3_config {
      bucket_name   = aws_s3_bucket.transcripts.id
      bucket_prefix = "contact_evaluations"
    }
    storage_type = "S3"
  }
}