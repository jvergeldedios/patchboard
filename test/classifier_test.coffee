assert = require("assert")

helpers = require("./helpers")
test = helpers.test

map =
  resource_collection:
    paths: ["/resource"]
  resource_instance:
    paths: ["/resource/:id"]


http_interface =
  resource_collection:
    actions:
      create:
        method: "POST"
        request_entity: "resource_instance"
        response_entity: "resource_instance"
      list:
        method: "GET"
        response_entity: "resource_collection"
      search:
        method: "GET"
        response_entity: "resource_collection"
        query:
          required:
            name: {type: "string"}
          optional:
            reverse: {type: "boolean"}
  resource_instance:
    actions:
      get:
        method: "GET"
        response_entity: "resource_instance"
      delete:
        method: "DELETE"
        authorization: "Basic"

schema =
  resource_collection:
    type: "resource"
    media_type: "patchboard.resource_collection"
    properties:
      some_property: {type: "string"}
  resource_instance:
    type: "resource"
    media_type: "patchboard.resource_instance"
    properties:
      some_property: {type: "string"}

Patchboard = require("../src/patchboard")

classifier = new Patchboard.Classifier
  interface: http_interface
  schema: schema
  map: map


class MockRequest

  constructor: (options) ->
    @url = options.url
    @method = options.method
    @headers = options.headers


test_classification = (name, want, options) ->
  test name, ->
    request = new MockRequest(options)
    result = classifier.classify(request)
    helpers.partial_equal(result, want)

test_classification "Action with Accept",
  {
    match: {resource_type: "resource_collection", action_name: "list"}
  },
  url: "http://hostname.com/resource"
  method: "GET"
  headers:
    "Accept": "patchboard.resource_collection"

test_classification "Action with Content-Type and Accept",
  {
    match: {resource_type: "resource_collection", action_name: "create"}
  },
  url: "http://hostname.com/resource"
  method: "POST"
  headers:
    "Content-Type": "patchboard.resource_instance"
    "Accept": "patchboard.resource_instance"

test_classification "Action with path capture",
  {
    match: {resource_type: "resource_instance", action_name: "get"},
    data:
      path: {id: "monkey"}
      accept: "patchboard.resource_instance"
  },
  url: "http://hostname.com/resource/monkey"
  method: "GET"
  headers:
    "Accept": "patchboard.resource_instance"

test_classification "Action with Authorization",
  {
    match: {resource_type: "resource_instance", action_name: "delete"},
  },
  url: "http://hostname.com/resource/monkey"
  method: "DELETE"
  headers:
    "Authorization": "Basic Pyrzqxgl"


test_classification "Action with query",
  {
    match: {resource_type: "resource_collection", action_name: "search"}
  },
  url: "http://hostname.com/resource?name=monk"
  method: "GET"
  headers:
    "Accept": "patchboard.resource_collection"

# Test failures


test_classification "failure to match Accept header",
  {error: "accept"},
  url: "http://hostname.com/resource/monkey"
  method: "GET"
  headers:
    "Accept": "bogus"

test_classification "failure to match Content-Type header",
  {error: "content_type"},
  url: "http://hostname.com/resource"
  method: "POST"
  headers:
    "Accept": "patchboard.resource_instance"
    "Content-Type": "bogus"

test_classification "failure to match method",
  {error: "method"},
  url: "http://hostname.com/resource/monkey"
  method: "PUT"
  headers:
    "Content-Type": "patchboard.resource_instance"
    "Accept": "patchboard.resource_instance"


test_classification "failure to match authorization scheme",
  {error: "authorization"},
  url: "http://hostname.com/resource/monkey"
  method: "DELETE"
  headers:
    "Authorization": "Capability Pyrzqxgl"









