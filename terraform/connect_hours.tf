resource "aws_connect_hours_of_operation" "song" {
  instance_id = aws_connect_instance.song.id
  name        = "Office Hours"
  description = "Demo office hours"
  time_zone   = "Asia/Singapore"

  config {
    day = "MONDAY"

    end_time {
      hours   = 18
      minutes = 8
    }

    start_time {
      hours   = 8
      minutes = 0
    }
  }

  config {
    day = "TUESDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  config {
    day = "WEDNESDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  config {
    day = "THURSDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  config {
    day = "FRIDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  config {
    day = "SATURDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  config {
    day = "SUNDAY"

    end_time {
      hours   = 17
      minutes = 0
    }

    start_time {
      hours   = 9
      minutes = 0
    }
  }

  tags = {
    "Name" = "Example Hours of Operation"
  }
}