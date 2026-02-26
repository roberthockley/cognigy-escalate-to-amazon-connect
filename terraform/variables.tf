variable "project" {
  type = object({
    tla = string
  })
  sensitive = false
}

variable "environment" {
  type = object({
    name       = string
    region     = string
    account_id = string
  })
  sensitive = false
}


variable "connect" {
  type = object({
    instance                        = string
    queue1                          = string
    outbound_caller_id_name         = string
    flow_name                       = string
    flow_description                = string
    greeting                        = string
    disconnect_flow_name            = string
    disconnect_flow_description     = string
    customer_queue_flow_name        = string
    customer_queue_flow_description = string
  })
  sensitive = false
}
