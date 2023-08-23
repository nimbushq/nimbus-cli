import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

enum YAMLFieldSchemaTypes {
    "time.Duration" = "time.Duration"
}

enum Signals {
    "logs" = "logs",
    "metrics" = "metrics",
    "traces" = "traces",
}

type YAMLFieldKind = "bool" | "string" | "int64" | "int" | "float64" | "map" | "struct";
type JSONSchemaType = "boolean" | "string" | "integer" | "number" | "object" | "null";

interface TopLevelYAMLField {
    type: string
    doc: string
    fields: YAMLField[]
}

interface YAMLField {
    name: string
    description: string
    type: YAMLFieldSchemaTypes | string
    kind: YAMLFieldKind
    default: any
    doc: string
    fields: any
}

interface JSONSchemaField {
    name: string
    description: string
    default: any
    type: JSONSchemaType | JSONSchemaType[]
    additionalProperties: object | boolean
    properties: object
}

function generatePatternSuffix(key: string) {
    return `^${key}(/[^/]+)*$`;
}

export function convertYamlToSchema(yamlString: string, opts?: { 
    patternPropertiesTransform: (s: string) => string }): object {
    const componentData = yaml.load(yamlString) as TopLevelYAMLField;

    const convertFieldToSchema = (field: YAMLField): object => {
        const fieldSchema: Partial<JSONSchemaField> = {};

        switch (field.kind) {
            case 'bool':
                fieldSchema.type = 'boolean';
                break;
            case 'string':
                fieldSchema.type = 'string';
                break;
            case 'int64':
                if (field.type === YAMLFieldSchemaTypes["time.Duration"]) {
                    fieldSchema.type = 'string';
                } else {
                    fieldSchema.type = 'integer';
                }
                break;
            case 'int':
                fieldSchema.type = 'integer';
                break;
            case 'float64':
                fieldSchema.type = 'number';
                break;
            case 'map':
                fieldSchema.type = 'object'
                // For simplicity, assume the value type is string
                fieldSchema.additionalProperties = { type: 'string' };
                break;
            case 'struct':
                fieldSchema.type = 'object';
                fieldSchema.additionalProperties = false;
                fieldSchema.properties = {};
                // TODO: some fields like `dataset.yaml` exporter not parsed right
                // currently swallow errors 
                try {
                    for (const subField of field.fields) {
                        // @ts-ignore
                        fieldSchema.properties[subField.name] = convertFieldToSchema(subField);
                    }
                } catch (err) {
                    console.log(`error parsing ${JSON.stringify(field)}`)
                }

                break;
        }

        if (field.default !== undefined) {
            fieldSchema.default = field.default;
        }

        if (field.doc) {
            fieldSchema.description = field.doc.trim();
        }

        return fieldSchema;
    };

    const propKey = opts?.patternPropertiesTransform ? 'patternProperties' : 'properties';

    const jsonSchema: any = {
        // TODO: assume all properties can be optional
        "type": ["object", "null"],
        "additionalProperties": false,
        description: componentData.doc,
        [propKey]: {}
        
    };

    for (const field of componentData.fields) {
        let fieldKey = field.name;
        if (opts?.patternPropertiesTransform) {
            fieldKey = opts.patternPropertiesTransform(fieldKey);
        }
        jsonSchema[propKey][fieldKey] = convertFieldToSchema(field);
    }

    return jsonSchema;
}

function generateServiceSignalSchema(opts: { signal: string, addPatternSuffix: boolean }) {
    return {
        [opts.addPatternSuffix ? generatePatternSuffix(opts.signal) : opts.signal]: {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "receivers": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "processors": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "exporters": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            }
        }
    }
}

export function processDirectory(metadataDir: string): any {
    const resultsForPatternProperties: Record<string, Record<string, object>> = {};
    const resultsForProperties: Record<string, Record<string, object>> = {};
    const componentsMeta = {
        "exporters": {
            desc: "An exporter is how data gets sent to different systems/back-ends. Generally, an exporter translates the internal format into another defined format.",
        },
        "extensions": {
            desc: "Extensions provide capabilities on top of the primary functionality of the collector.",
        },
        "processors": {
            desc: "Processors are used at various stages of a pipeline. Generally, a processor pre-processes data before it is exported (e.g. modify attributes or sample) or helps ensure that data makes it through a pipeline successfully (e.g. batch/retry).",
        },
        "receivers": {
            desc: "A receiver is how data gets into the OpenTelemetry Collector.",
        },
    }

    function crawl(directory: string) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = fs.statSync(filePath);
            const relativeDir = path.relative(metadataDir, directory);  // Gets the relative directory path

            if (stat.isDirectory()) {
                crawl(filePath);
            } else if (path.extname(filePath) === '.yaml') {
                const yamlString = fs.readFileSync(filePath, 'utf8');
                const componentType = relativeDir + "s"
                // console.log(`reading ${relativeDir}/${filePath}}`)
                let convertYamlOpts: any = undefined;
                const schema = convertYamlToSchema(yamlString, convertYamlOpts);

                // If the directory isn't already a key in results, add it
                if (!resultsForPatternProperties[componentType]) {
                    resultsForPatternProperties[componentType] = {};
                }
                if (!resultsForProperties[componentType]) {
                    resultsForProperties[componentType] = {};
                }

                // Use the base filename (without the .yaml extension) as the key for the schema
                const componentKey = path.basename(file, '.yaml');

                // add results
                resultsForPatternProperties[componentType][
                    generatePatternSuffix(componentKey)
                ] = schema;
                resultsForProperties[componentType][componentKey] = schema;
            }
        }
    }
    crawl(metadataDir);


    const output = {
        "$id": "https://github.com/nimbushq/otel-validator/blob/main/assets/schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "otel",
        "type": "object",
        "additionalProperties": false,
        "properties": {
        } as any,
    }

    for (const componentType of Object.keys(resultsForPatternProperties)) {
        output['properties'][componentType] = {
            "type": "object",
            // @ts-ignore
            "description": componentsMeta[componentType].desc,
            "additionalProperties": false,
            "patternProperties": {
                additionalProperties: false,
                ...resultsForPatternProperties[componentType],
            },
            "properties": {
                additionalProperties: false,
                ...resultsForProperties[componentType],
            }
        }
    }

    const service = {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "extensions": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "pipelines": {
                "additionalProperties": false,
                "type": "object",
                "properties": {
                    ...Object.values(Signals).map(signal => generateServiceSignalSchema({ signal, addPatternSuffix: false })).reduce((merged, obj) => ({ ...merged, ...obj }), {})
                },
                "patternProperties": {
                    ...Object.values(Signals).map(signal => generateServiceSignalSchema({ signal, addPatternSuffix: true })).reduce((merged, obj) => ({ ...merged, ...obj }), {})
                }
            }
        }
    }
    output['properties']['service'] = service

    return output;
}
