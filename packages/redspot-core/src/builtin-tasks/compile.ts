import chalk from 'chalk';
import path from 'path';
import { Compiler } from '../ink/compiler';
import {
  CargoMetadata,
  filterContractPackage,
  getResolvedWorkspace,
  getToolchain
} from '../ink/resolve';
import { subtask, task, types } from '../internal/core/config/config-env';
import {
  TASK_COMPILE,
  TASK_COMPILE_COMPILE,
  TASK_COMPILE_INK_ARTIFACTS,
  TASK_COMPILE_INK_GET_COMPILER_INPUT,
  TASK_COMPILE_INK_GET_RESOLVED_WORKSPACE,
  TASK_COMPILE_INK_RUN_COMPILER,
  TASK_COMPILE_INK_RUN_GENERATE_METADATA
} from './task-names';

subtask(TASK_COMPILE_INK_GET_RESOLVED_WORKSPACE, async (_, { config }) => {
  return getResolvedWorkspace(config.paths.sources);
});

subtask(TASK_COMPILE_INK_GET_COMPILER_INPUT, async (_, { run }) => {
  const manifest: CargoMetadata = await run(
    TASK_COMPILE_INK_GET_RESOLVED_WORKSPACE
  );
  const metadata = filterContractPackage(manifest);

  if (!metadata.packages.length) {
    throw new Error(`No contract source file available.`);
  }

  console.log(
    `✨  Detect contracts: ${chalk.yellow(
      metadata.packages
        .map((obj) => `${obj.name}${chalk.gray(`(${obj.manifest_path})`)}`)
        .join(',')
    )}`
  );
  console.log('');

  return metadata;
});

subtask(TASK_COMPILE_INK_RUN_COMPILER)
  .addParam('input', 'The compiler standard JSON input', undefined, types.json)
  .addParam(
    'toolchain',
    'Specifies the tool chain to use to compile the contract',
    undefined,
    types.string,
    true
  )
  .setAction(
    async (
      {
        input,
        toolchain
      }: {
        input: CargoMetadata;
        toolchain: string;
      },
      { config }
    ) => {
      const compiler = new Compiler(input, {
        toolchain: getToolchain(config, toolchain)
      });

      return compiler.compileAll();
    }
  );

subtask(TASK_COMPILE_INK_RUN_GENERATE_METADATA)
  .addParam('input', 'The compiler standard JSON input', undefined, types.json)
  .addParam(
    'toolchain',
    'Specifies the tool chain to use to compile the contract',
    undefined,
    types.string,
    true
  )
  .setAction(
    async (
      {
        input,
        toolchain
      }: {
        input: CargoMetadata;
        toolchain: string;
      },
      { config }
    ) => {
      const compiler = new Compiler(input, {
        toolchain: getToolchain(config, toolchain)
      });

      return compiler.generateAllMetadata();
    }
  );

subtask(TASK_COMPILE_COMPILE, async ({ toolchain }, { config, run }) => {
  const input = await run(TASK_COMPILE_INK_GET_COMPILER_INPUT);

  const wasmPaths: string[] = await run(TASK_COMPILE_INK_RUN_COMPILER, {
    input,
    toolchain
  });

  const metadataPaths: string[] = await run(
    TASK_COMPILE_INK_RUN_GENERATE_METADATA,
    {
      input,
      toolchain
    }
  );

  return {
    wasmPaths,
    metadataPaths
  };
});

subtask(
  TASK_COMPILE_INK_ARTIFACTS,
  async ({ toolchain }, { artifacts, config, run }) => {
    const output = await run(TASK_COMPILE_COMPILE, { toolchain });

    if (output.wasmPaths?.length) {
      console.log(
        `🚚  Copy wasm files: ${output.wasmPaths
          .map((p) => path.basename(p))
          .join(', ')}`
      );
      await artifacts.saveArtifact(output.wasmPaths);
    }

    if (output.metadataPaths?.length) {
      console.log(`🚚  Copy abi files: ${output.metadataPaths.join(', ')}`);
      await artifacts.saveArtifact(output.metadataPaths);
    }

    console.log(
      `🎉  Compile successfully! You can find them at ${chalk.cyan(
        config.paths.artifacts
      )}`
    );
    console.log('');
  }
);

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
  .addParam(
    'toolchain',
    'Specifies the tool chain to use to compile the contract',
    undefined,
    types.string,
    true
  )
  .setAction(async ({ toolchain }: { toolchain?: string }, { config, run }) =>
    run(TASK_COMPILE_INK_ARTIFACTS, {
      toolchain: getToolchain(config, toolchain)
    })
  );
