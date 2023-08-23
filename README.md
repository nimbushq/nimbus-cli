# `nimbus-cli`

This is a grab bag of CLI helpers for various [nimbus](https://github.com/nimbusproject/nimbus) projects.

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

```