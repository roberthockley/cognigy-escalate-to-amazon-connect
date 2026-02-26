data "aws_connect_contact_flow" "default_outbound" {
  instance_id = aws_connect_instance.song.id
  name        = "Default outbound"
}

resource "aws_connect_contact_flow" "inbound_flow" {
  instance_id = aws_connect_instance.song.id
  name        = var.connect.flow_name
  description = var.connect.flow_description
  type        = "CONTACT_FLOW"
  content = jsonencode({
  "Version": "2019-10-30",
  "StartAction": "2d09a2d0-62e3-4d38-b48c-29921d328d39",
  "Metadata": {
    "entryPointPosition": {
      "x": 40,
      "y": 40
    },
    "ActionMetadata": {
      "Welcome Prompt": {
        "position": {
          "x": 1000.8,
          "y": 32
        },
        "isFriendlyName": true
      },
      "9271dae1-f525-4127-a10d-de1f1818c47f": {
        "position": {
          "x": 1294.4,
          "y": 28
        },
        "parameters": {
          "QueueId": {
            "displayName": "sales"
          }
        },
        "queue": {
          "text": "sales"
        }
      },
      "69a3836f-2aad-41c9-bd60-c14644639d3c": {
        "position": {
          "x": 1557.6,
          "y": 25.6
        }
      },
      "79c3f2c8-aa64-4d77-a13f-8d3b6b10d262": {
        "position": {
          "x": 1820,
          "y": 36
        }
      },
      "6848ba2b-5e30-45a9-b54e-acf8814838a9": {
        "position": {
          "x": 744,
          "y": 32
        },
        "parameters": {
          "EventHooks": {
            "CustomerRemaining": {
              "displayName": "Cognigy Disconnect Flow"
            }
          }
        },
        "contactFlow": {
          "text": "Cognigy Disconnect Flow",
          "id": "${aws_connect_contact_flow.disconnect_flow.arn}"
        }
      },
      "2d09a2d0-62e3-4d38-b48c-29921d328d39": {
        "position": {
          "x": 191.2,
          "y": 47.2
        }
      },
      "2ad21967-98e7-478d-b4cd-5f78a19ace0e": {
        "position": {
          "x": 468.8,
          "y": 32.8
        },
        "parameters": {
          "EventHooks": {
            "CustomerQueue": {
              "displayName": "Cognigy Customer Queue Flow"
            }
          }
        },
        "contactFlow": {
          "text": "Cognigy Customer Queue Flow",
          "id": "${aws_connect_contact_flow.customer_queue.arn}"
        },
        "customerOrAgent": true
      }
    },
    "Annotations": [],
    "name": "Cognigy Inbound Flow",
    "description": "Inbound flow for Cognigy Chat to Amazon Conenct Demo",
    "type": "contactFlow",
    "status": "published",
    "hash": {}
  },
  "Actions": [
    {
      "Parameters": {
        "Text": "Welcome to Goliath National Bank, an agent will be with you shortly"
      },
      "Identifier": "Welcome Prompt",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "9271dae1-f525-4127-a10d-de1f1818c47f",
        "Errors": [
          {
            "NextAction": "9271dae1-f525-4127-a10d-de1f1818c47f",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {
        "QueueId": "${aws_connect_queue.sales.arn}"
      },
      "Identifier": "9271dae1-f525-4127-a10d-de1f1818c47f",
      "Type": "UpdateContactTargetQueue",
      "Transitions": {
        "NextAction": "69a3836f-2aad-41c9-bd60-c14644639d3c",
        "Errors": [
          {
            "NextAction": "69a3836f-2aad-41c9-bd60-c14644639d3c",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {},
      "Identifier": "69a3836f-2aad-41c9-bd60-c14644639d3c",
      "Type": "TransferContactToQueue",
      "Transitions": {
        "NextAction": "79c3f2c8-aa64-4d77-a13f-8d3b6b10d262",
        "Errors": [
          {
            "NextAction": "79c3f2c8-aa64-4d77-a13f-8d3b6b10d262",
            "ErrorType": "QueueAtCapacity"
          },
          {
            "NextAction": "79c3f2c8-aa64-4d77-a13f-8d3b6b10d262",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {},
      "Identifier": "79c3f2c8-aa64-4d77-a13f-8d3b6b10d262",
      "Type": "DisconnectParticipant",
      "Transitions": {}
    },
    {
      "Parameters": {
        "EventHooks": {
          "CustomerRemaining": "${aws_connect_contact_flow.disconnect_flow.arn}"
        }
      },
      "Identifier": "6848ba2b-5e30-45a9-b54e-acf8814838a9",
      "Type": "UpdateContactEventHooks",
      "Transitions": {
        "NextAction": "Welcome Prompt",
        "Errors": [
          {
            "NextAction": "Welcome Prompt",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {
        "FlowLoggingBehavior": "Enabled"
      },
      "Identifier": "2d09a2d0-62e3-4d38-b48c-29921d328d39",
      "Type": "UpdateFlowLoggingBehavior",
      "Transitions": {
        "NextAction": "2ad21967-98e7-478d-b4cd-5f78a19ace0e"
      }
    },
    {
      "Parameters": {
        "EventHooks": {
          "CustomerQueue": "${aws_connect_contact_flow.customer_queue.arn}"
        }
      },
      "Identifier": "2ad21967-98e7-478d-b4cd-5f78a19ace0e",
      "Type": "UpdateContactEventHooks",
      "Transitions": {
        "NextAction": "6848ba2b-5e30-45a9-b54e-acf8814838a9",
        "Errors": [
          {
            "NextAction": "6848ba2b-5e30-45a9-b54e-acf8814838a9",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    }
  ]
})
  tags = {
    "Name"        = "Test Contact Flow"
    "Application" = "Terraform"
    "Method"      = "Create"
  }
}

resource "aws_connect_contact_flow" "disconnect_flow" {
  instance_id = aws_connect_instance.song.id
  name        = var.connect.disconnect_flow_name
  description = var.connect.disconnect_flow_description
  type        = "CONTACT_FLOW"
  content = jsonencode({
  "Version": "2019-10-30",
  "StartAction": "44c598fe-2a67-4522-b3e9-6b6c09ae96b9",
  "Metadata": {
    "entryPointPosition": {
      "x": 14.4,
      "y": 14.4
    },
    "ActionMetadata": {
      "44c598fe-2a67-4522-b3e9-6b6c09ae96b9": {
        "position": {
          "x": 140,
          "y": 14.4
        }
      },
      "cc927fd6-a3fd-437a-81d3-c38a5130468d": {
        "position": {
          "x": 395.2,
          "y": 17.6
        },
        "parameters": {
          "TimeLimitSeconds": {
            "unit": 60
          }
        },
        "timeoutUnit": {
          "display": "Minutes",
          "value": "minute"
        }
      },
      "3ba86427-44ee-4c18-9c11-f33ba8e65942": {
        "position": {
          "x": 672.8,
          "y": 16
        }
      },
      "8b170d37-9ee6-4fea-b5d0-6fb2df662987": {
        "position": {
          "x": 676.8,
          "y": 186.4
        }
      },
      "afd69f71-a5c0-4df2-88b1-68611856b3fc": {
        "position": {
          "x": 676.8,
          "y": 359.2
        }
      },
      "616f94d7-de1d-4b2a-b503-cf37b9f9f6b5": {
        "position": {
          "x": 940.8,
          "y": 15.2
        }
      },
      "8e32b3b8-98d0-4614-a138-e9999a55b382": {
        "position": {
          "x": 1230.4,
          "y": 216.8
        }
      }
    },
    "Annotations": [],
    "name": "${var.connect.disconnect_flow_name}",
    "description": "${var.connect.disconnect_flow_description}",
    "type": "contactFlow",
    "status": "published",
    "hash": {}
  },
  "Actions": [
    {
      "Parameters": {
        "Text": "The agent has disconnected. If the customer sends a message in the next 15 minutes, the chat will pick up where it left off."
      },
      "Identifier": "44c598fe-2a67-4522-b3e9-6b6c09ae96b9",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "cc927fd6-a3fd-437a-81d3-c38a5130468d"
      }
    },
    {
      "Parameters": {
        "Events": [
          "CustomerReturned"
        ],
        "TimeLimitSeconds": "900"
      },
      "Identifier": "cc927fd6-a3fd-437a-81d3-c38a5130468d",
      "Type": "Wait",
      "Transitions": {
        "NextAction": "afd69f71-a5c0-4df2-88b1-68611856b3fc",
        "Conditions": [
          {
            "NextAction": "3ba86427-44ee-4c18-9c11-f33ba8e65942",
            "Condition": {
              "Operator": "Equals",
              "Operands": [
                "CustomerReturned"
              ]
            }
          },
          {
            "NextAction": "8b170d37-9ee6-4fea-b5d0-6fb2df662987",
            "Condition": {
              "Operator": "Equals",
              "Operands": [
                "WaitCompleted"
              ]
            }
          }
        ],
        "Errors": [
          {
            "NextAction": "afd69f71-a5c0-4df2-88b1-68611856b3fc",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {
        "Text": "You are now being transferred to queue to chat with another agent."
      },
      "Identifier": "3ba86427-44ee-4c18-9c11-f33ba8e65942",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "616f94d7-de1d-4b2a-b503-cf37b9f9f6b5"
      }
    },
    {
      "Parameters": {
        "Text": "The timer has expired. Disconnecting."
      },
      "Identifier": "8b170d37-9ee6-4fea-b5d0-6fb2df662987",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "8e32b3b8-98d0-4614-a138-e9999a55b382"
      }
    },
    {
      "Parameters": {
        "Text": "An error occurred."
      },
      "Identifier": "afd69f71-a5c0-4df2-88b1-68611856b3fc",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "8e32b3b8-98d0-4614-a138-e9999a55b382"
      }
    },
    {
      "Parameters": {},
      "Identifier": "616f94d7-de1d-4b2a-b503-cf37b9f9f6b5",
      "Type": "TransferContactToQueue",
      "Transitions": {
        "NextAction": "8e32b3b8-98d0-4614-a138-e9999a55b382",
        "Errors": [
          {
            "NextAction": "8e32b3b8-98d0-4614-a138-e9999a55b382",
            "ErrorType": "QueueAtCapacity"
          },
          {
            "NextAction": "8e32b3b8-98d0-4614-a138-e9999a55b382",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {},
      "Identifier": "8e32b3b8-98d0-4614-a138-e9999a55b382",
      "Type": "DisconnectParticipant",
      "Transitions": {}
    }
  ]
})
}

resource "aws_connect_contact_flow" "customer_queue" {
  instance_id = aws_connect_instance.song.id
  name        = var.connect.customer_queue_flow_name
  description = var.connect.customer_queue_flow_description
  type        = "CUSTOMER_QUEUE"
  content = jsonencode({
  "Version": "2019-10-30",
  "StartAction": "36f28515-515b-40d5-9c41-1e67aa4555c7",
  "Metadata": {
    "entryPointPosition": {
      "x": 242.4,
      "y": 172
    },
    "ActionMetadata": {
      "36f28515-515b-40d5-9c41-1e67aa4555c7": {
        "position": {
          "x": 392,
          "y": 198.4
        }
      },
      "c95e2fd8-684f-4b11-80ee-a4a3348f1e9b": {
        "position": {
          "x": 653.6,
          "y": 200.8
        },
        "parameters": {
          "TimeLimitSeconds": {
            "unit": 1
          }
        },
        "timeoutUnit": {
          "display": "Seconds",
          "value": "second"
        }
      },
      "cd2f75c8-24ad-4c7c-89d6-d22df0acb21d": {
        "position": {
          "x": 663.2,
          "y": 409.6
        }
      }
    },
    "Annotations": [],
    "name": "${var.connect.customer_queue_flow_name}",
    "description": "${var.connect.customer_queue_flow_description}",
    "type": "customerQueue",
    "status": "published",
    "hash": {}
  },
  "Actions": [
    {
      "Parameters": {
        "Text": "Thank you for your chat. Your chat is very important to us and will be answered in the order it was received."
      },
      "Identifier": "36f28515-515b-40d5-9c41-1e67aa4555c7",
      "Type": "MessageParticipant",
      "Transitions": {
        "NextAction": "c95e2fd8-684f-4b11-80ee-a4a3348f1e9b",
        "Errors": [
          {
            "NextAction": "cd2f75c8-24ad-4c7c-89d6-d22df0acb21d",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {
        "TimeLimitSeconds": "30"
      },
      "Identifier": "c95e2fd8-684f-4b11-80ee-a4a3348f1e9b",
      "Type": "Wait",
      "Transitions": {
        "NextAction": "cd2f75c8-24ad-4c7c-89d6-d22df0acb21d",
        "Conditions": [
          {
            "NextAction": "36f28515-515b-40d5-9c41-1e67aa4555c7",
            "Condition": {
              "Operator": "Equals",
              "Operands": [
                "WaitCompleted"
              ]
            }
          }
        ],
        "Errors": [
          {
            "NextAction": "cd2f75c8-24ad-4c7c-89d6-d22df0acb21d",
            "ErrorType": "NoMatchingError"
          }
        ]
      }
    },
    {
      "Parameters": {},
      "Identifier": "cd2f75c8-24ad-4c7c-89d6-d22df0acb21d",
      "Type": "EndFlowExecution",
      "Transitions": {}
    }
  ]
})
  tags = {
    "Name"        = "Test Contact Flow"
    "Application" = "Terraform"
    "Method"      = "Create"
  }
}