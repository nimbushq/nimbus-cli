#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from "fs-extra";
import { processDirectory } from './parseOtelYaml2Json';
import chalk from 'chalk';

yargs(hideBin(process.argv))
  .scriptName("nimbus")
  .alias("nim", "nimbus")
  .command(
    'gen-otel-json-schema',
    'Generate OpenTelemetry JSON schema',
    (yargs) => {
      return yargs
        .option('metadata-dir', {
          describe: 'The directory where YAML metadata files are located. This is the output of https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/cmd/configschema/cfgmetadatagen/cfgmetadatagen',
          type: 'string',
          demandOption: true,
        })
        .option('output-file', {
          describe: 'The file where the JSON schema files should be written to',
          type: 'string',
          default: "schema.json"
        });
    },
    async (argv) => {
      console.log(`Generating JSON schema from ${argv['metadata-dir']} and saving to ${argv['output-dir']}`);
      argv.metadataDir
      if (!fs.existsSync(argv.metadataDir)) {
        console.log("metadata-dir does not exist");
        process.exit(1);
      }

      fs.ensureFileSync(argv.outputFile);
      const resp = processDirectory(argv.metadataDir)
      fs.writeJSONSync(argv.outputFile, resp, { spaces: 2 });
      console.log(chalk.green("done"));
    }
  )
  .demandCommand()
  .help()
  .argv;
