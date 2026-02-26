project = {
  tla = "song"
}

environment = {
  name       = "demo"
  region     = "ap-southeast-1"
  account_id = "117134819170"
}

connect = {
  instance                        = "song"
  queue1                          = "sales"
  outbound_caller_id_name         = "Accenture Song"
  flow_name                       = "Cognigy Inbound Flow"
  flow_description                = "Inbound flow for Cognigy Chat to Amazon Conenct Demo"
  greeting                        = "Welcome to Goliath National Bank, an agent will be with you shortly"
  disconnect_flow_name            = "Cognigy Disconnect Flow"
  disconnect_flow_description     = "Disconnect flow for Cognigy Chat to Amazon Conenct Demo"
  customer_queue_flow_name        = "Cognigy Customer Queue Flow"
  customer_queue_flow_description = "Customer Queue flow for Cognigy Chat to Amazon Conenct Demo"
}
