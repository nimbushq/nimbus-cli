# `nimbus-cli`

This is a grab bag of CLI helpers for various [nimbus](https://github.com/nimbusproject/nimbus) projects.

It is currently used to generate the json schema for the [otel-validator](https://github.com/nimbushq/otel-validator)

## Quickstart

```sh
cd nimbus-cli
npm i
npm run build
```

## Usage

```sh
nimbus <command>

Commands:
  nimbus gen-otel-json-schema  Generate OpenTelemetry JSON schema

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Commands

### gen-otel-json-schema

This is used to generate json schema for the otel-collector via the output of [cfgmetadatagen](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/cmd/configschema/cfgmetadatagen/cfgmetadatagen)

```sh
Generate OpenTelemetry JSON schema

Options:
  --version       Show version number                                  [boolean]
  --help          Show help                                            [boolean]
  --metadata-dir  The directory where YAML metadata files are located. This is
                  the output of cfgmetadatagen
                                                             [string] [required]
  --output-file   The file where the JSON schema files should be written to
                                               [string] [default: "schema.json"]
```

Example
```sh
nimbus gen-otel-json-schema --metadata-dir /path/to/cfg-metadata --output-file otel-schema.json
```

Output
```sh
Generating JSON schema from /Users/kevinlin/code/_ref/otel/opentelemetry-collector-contrib/cmd/configschema/cfg-metadata and saving to undefined
error parsing {"name":"traces","type":"datasetexporter.TracesSettings","kind":"struct"}
error parsing {"name":"metrics_exporter","type":"component.ID","kind":"struct","doc":"MetricsExporter specifies the name of the metrics exporter to be used when\nexporting stats metrics.\n"}
```

> NOTE: there currently is an issue with two components: `exporter/dataset` and `exporter//datadog` as they have `struct` arguments that have no child `fields` defined. This causes an error when generating the schema.