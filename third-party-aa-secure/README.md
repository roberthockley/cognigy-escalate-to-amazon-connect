Views:

Attribute Bar
{
    "Attributes": [
      {"Label": "First Item", "Value": "Test"},
      {"Label": "Second Item", "Value": "Test2"}
    ]
}

Attributes Section:
{
"Items": [
      {"Label": "Phone Number", "Value": "$.CustomerEndpoint.Address"},
      {"Label": "Campaign", "Value": "$.Attributes.Queue"},
      {"Label": "First Atempt", "Value": "$.Attributes.1stl"},
      {"Label": "First Result", "Value": "$.Attributes.1str"},
      {"Label": "Second Attempt", "Value": "$.Attributes.2ndl"},
      {"Label": "Second Result", "Value": "$.Attributes.2ndr"}
    ]
}

[{"AutoOpen":false,"Label":"First Name","Value":"John","Copyable":false},{"AutoOpen":false,"Label":"Last Name","Value":"Doe","Copyable":false},{"AutoOpen":false,"ResourceId":"123456","Label":"Account Number","Value":"123456","Copyable":true,"LinkType":"case"},{"AutoOpen":false,"Label":"Queue Name","Value":"New_Car_Reservation","Copyable":false}]