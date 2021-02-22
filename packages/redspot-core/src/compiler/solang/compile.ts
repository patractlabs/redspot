import execa from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { SolangInput } from './compilerInput';

export type SolangOutput = {
  outputDirectory: string;
  outputFiles: string[];
};

export async function compile(
  input: SolangInput,
  outPutDir: string
): Promise<SolangOutput> {
  const outputDirectory = path.resolve(outPutDir);
  fs.ensureDirSync(outputDirectory);

  const args = [
    `--target`,
    'substrate',
    '--output',
    outputDirectory,
    '-v',
    ...input.sources
  ];

  let str = '';

  const { stdout, stderr } = await execa('solang', args);

  str += stdout;
  str += '\n';
  str += stderr;
  str += '\n';

  console.log(str);

  const contractPaths = new Set<string>();

  const reg = /info:\sSaving\s(.*)\sfor\scontract?/g;
  let arr: RegExpExecArray;

  while ((arr = reg.exec(str)) !== null) {
    const filePath = arr[1].trim();
    contractPaths.add(filePath);
  }

  return {
    outputDirectory,
    outputFiles: Array.from(contractPaths)
  };
}
