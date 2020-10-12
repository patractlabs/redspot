import chalk from "chalk";
import { execSync } from "child_process";
import spawn from "cross-spawn";
import fs from "fs-extra";
import path from "path";
import semver from "semver";
import { CargoMetadata, CargoPackage } from "./resolve";

export interface CompilerOptions {
  toolchain: string;
  verbose?: boolean;
}

export class Compiler {
  private readonly _metadata: CargoMetadata;
  private readonly _toolchain: string;
  private readonly _verbose: boolean;

  constructor(
    metadata: CargoMetadata,
    { toolchain, verbose = false }: CompilerOptions
  ) {
    this._metadata = metadata;
    this._toolchain = toolchain;
    this._verbose = verbose;
    const pass = this.checkRustEnv();
    if (!pass) {
      throw new Error("Unable to compile the contracts");
    }
  }

  public async checkRustEnv() {
    let version: string;
    try {
      const versionData = execSync("cargo contract -V");
      version = versionData.toString().split(" ")[1];
    } catch (error) {
      console.log(chalk.red("ERROR: No `cargo-contract` found"));
      console.log(`Run the following command to install it:`);
      console.log(
        chalk.cyan(
          `$ cargo install --git https://github.com/paritytech/cargo-contract cargo-contract --force`
        )
      );
      return false;
    }

    if (semver.lt(version, "0.7.0")) {
      console.log(
        chalk.red("ERROR: `cargo-contract` requires v0.7.0 or above")
      );
      console.log(`Run the following command to install it:`);
      console.log(
        chalk.cyan(
          `$ cargo install --git https://github.com/paritytech/cargo-contract cargo-contract --force`
        )
      );
      return false;
    }
  }

  public async compileAll(): Promise<string[]> {
    const wasmFiles: string[] = [];

    for (const contract of this._metadata.packages) {
      const wasmPath = await this.compile(contract.name);
      wasmFiles.push(wasmPath);
    }

    return wasmFiles;
  }

  public async compile(contractName: string): Promise<string> {
    const contract = this._metadata.packages.find(
      ({ name }) => name === contractName
    );

    if (!contract) {
      throw new Error(`No contract ${chalk.green(contractName)}`);
    }

    console.log(chalk.magenta(`===== Compile ${contract.name} =====`));
    console.log("");

    await this.runCompile(contract);

    return path.resolve(
      this._metadata.target_directory,
      `${contract.name}.wasm`
    );
  }

  public async runCompile(contract: CargoPackage) {
    return new Promise((resolve, reject) => {
      let args = [`+${this._toolchain}`, `contract`, "build"];
      if (this._verbose) {
        args = args.concat("--", "verbose");
      }

      const child = spawn("cargo", args, {
        stdio: "inherit",
        cwd: path.dirname(contract.manifest_path),
      });

      console.log(`$ cargo ${args.join(" ")}`);

      child.on("close", (code) => {
        if (code !== 0) {
          console.log();
          console.log(
            chalk.red(
              `Failed to compile the contract ${chalk.yellow(contract.name)}`
            )
          );
          reject({
            command: `cargo ${args.join(" ")}`,
          });
          return;
        }
        resolve();
      });
    });
  }

  public async generateAllMetadata(): Promise<string[]> {
    const abis: string[] = [];

    const mainContract = this._metadata.packages.find(
      (c) => path.dirname(c.manifest_path) === this._metadata.workspace_root
    );

    const abiPath = await this.generateMetadata(mainContract.name);

    abis.push(abiPath);

    return abis;
  }

  public async generateMetadata(contractName: string): Promise<string> {
    const contract = this._metadata.packages.find(
      ({ name }) => name === contractName
    );

    if (!contract) {
      throw new Error(`No contract ${chalk.green(contractName)}`);
    }

    console.log(
      chalk.magenta(`===== Generate metadata ${contract.name} =====`)
    );
    console.log("");

    await this.runGenerateMetadata(contract);

    const metadataPath = path.resolve(
      this._metadata.target_directory,
      `metadata.json`
    );
    const renamePath = path.resolve(
      this._metadata.target_directory,
      `${contract.name}.json`
    );

    fs.copyFileSync(metadataPath, renamePath);

    return renamePath;
  }

  public async runGenerateMetadata(contract: CargoPackage) {
    return new Promise((resolve, reject) => {
      let args = [`+${this._toolchain}`, `contract`, "generate-metadata"];

      if (this._verbose) {
        args = args.concat("--", "verbose");
      }

      const child = spawn("cargo", args, {
        stdio: "inherit",
      });

      console.log(`cargo ${args.join(" ")}`);

      child.on("close", (code) => {
        if (code !== 0) {
          console.log();
          console.log(
            chalk.red(
              `Failed to generate the metadata ${chalk.yellow(contract.name)}`
            )
          );
          reject({
            command: `cargo ${args.join(" ")}`,
          });
          return;
        }
        resolve();
      });
    });
  }
}
