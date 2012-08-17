// Generated by CoffeeScript 1.3.3
var SchemaManager,
  __slice = [].slice;

SchemaManager = (function() {

  SchemaManager.urnize = function(identifier) {
    return "urn:json:" + identifier;
  };

  SchemaManager.normalize = function(schema) {
    schema.id = this.urnize(schema.id);
    this.top_level_ids(schema.properties, schema.id);
    return this.normalize_properties(schema.properties, schema.id);
  };

  SchemaManager.top_level_ids = function(properties, namespace) {
    var name, schema, _results;
    _results = [];
    for (name in properties) {
      schema = properties[name];
      if (schema.id) {
        if (schema.id.indexOf("#") === 0) {
          _results.push(schema.id = "" + namespace + schema.id);
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(schema.id = "" + namespace + "#" + name);
      }
    }
    return _results;
  };

  SchemaManager.normalize_properties = function(properties, namespace) {
    var definition, name, _results;
    _results = [];
    for (name in properties) {
      definition = properties[name];
      _results.push(this.normalize_schema(name, definition, namespace));
    }
    return _results;
  };

  SchemaManager.normalize_schema = function(name, schema, namespace) {
    if (schema.$ref) {
      this.normalize_ref(schema, namespace);
    } else if (schema["extends"] != null) {
      this.normalize_ref(schema["extends"], namespace);
    } else if (schema.type === "array") {
      this.normalize_array(schema, namespace);
    } else if (schema.type === "object") {
      this.normalize_object(schema, namespace);
    }
    if (schema.properties) {
      return this.normalize_properties(schema.properties, namespace);
    }
  };

  SchemaManager.normalize_extends = function(schema, namespace) {
    if (schema.$ref) {
      return this.normalize_ref(schema, namespace);
    }
  };

  SchemaManager.normalize_array = function(schema, namespace) {
    var _ref, _ref1;
    if ((_ref = schema.items) != null ? _ref.$ref : void 0) {
      this.normalize_ref(schema.items, namespace);
    }
    if ((_ref1 = schema.additionalItems) != null ? _ref1.$ref : void 0) {
      return this.normalize_ref(schema.additionalItems, namespace);
    }
  };

  SchemaManager.normalize_object = function(schema, namespace) {
    var _ref;
    if ((_ref = schema.additionalProperties) != null ? _ref.$ref : void 0) {
      return this.normalize_ref(schema.additionalProperties, namespace);
    }
  };

  SchemaManager.normalize_ref = function(schema, namespace) {
    var index;
    index = schema.$ref.indexOf("#");
    if (index === 0) {
      return schema.$ref = "" + namespace + schema.$ref;
    } else if (index !== -1) {
      return schema.$ref = this.urnize(schema.$ref);
    }
  };

  SchemaManager.is_primitive = function(type) {
    var name, _i, _len, _ref;
    _ref = ["string", "number", "boolean"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (type === name) {
        return true;
      }
    }
    return false;
  };

  function SchemaManager() {
    var schema, schemas, _i, _len, _ref;
    schemas = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.schemas = schemas;
    this.names = {};
    this.ids = {};
    this.media_types = {};
    _ref = this.schemas;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      schema = _ref[_i];
      this.register_schema(schema);
    }
  }

  SchemaManager.prototype.find = function(options) {
    var id;
    if (id = options.id) {
      if (id.indexOf(":") === -1) {
        id = SchemaManager.urnize(id);
      }
      return this.ids[id];
    } else if (options.media_type) {
      return this.media_types[options.media_type];
    }
  };

  SchemaManager.prototype.register_schema = function(schema) {
    var definition, name, _ref, _results;
    _ref = schema.properties;
    _results = [];
    for (name in _ref) {
      definition = _ref[name];
      this.inherit_properties(definition);
      this.names[name] = definition;
      if (definition.id) {
        this.ids[definition.id] = definition;
      }
      if (definition.mediaType) {
        _results.push(this.media_types[definition.mediaType] = definition);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SchemaManager.prototype.inherit_properties = function(schema) {
    var key, merged, parent, parent_id, value, _ref, _ref1;
    if (schema["extends"]) {
      parent_id = schema["extends"].$ref;
      parent = this.ids[parent_id];
      if (parent) {
        merged = {
          properties: {}
        };
        _ref = parent.properties;
        for (key in _ref) {
          value = _ref[key];
          merged.properties[key] = value;
        }
        _ref1 = schema.properties;
        for (key in _ref1) {
          value = _ref1[key];
          merged.properties[key] = value;
        }
        return schema.properties = merged.properties;
      } else {
        console.log(schema);
        throw "Could not find parent schema: " + parent_id;
      }
    }
  };

  SchemaManager.prototype.document = function() {
    return this.document_markdown();
  };

  SchemaManager.prototype.document_markdown = function() {
    var name, out, schema, _ref;
    out = [];
    out.push("# Schemas");
    _ref = this.names;
    for (name in _ref) {
      schema = _ref[name];
      out.push(this.schema_doc(name, schema));
    }
    return out.join("\n\n");
  };

  SchemaManager.prototype.schema_doc = function(name, schema) {
    var lines;
    lines = [];
    lines.push("<a id=\"" + (schema.id.replace("#", "/")) + "\"></a>\n## " + name + " ");
    lines.push("```json\n" + (JSON.stringify(schema, null, 2)) + "\n```");
    return lines.join("\n\n");
  };

  return SchemaManager;

})();

module.exports = SchemaManager;