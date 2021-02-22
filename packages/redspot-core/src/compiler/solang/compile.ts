import execa from 'execa';
import path from 'path';
import { SolangInput } from './compilerInput';

export type SolangOutput = {
  name: string;
  contract: string;
};

export async function compile(input: SolangInput, outPutdir: string) {
  let args = [
    `--target`,
    'substrate',
    '--output',
    path.resolve(outPutdir),
    '-v',
    ...input.sources
  ];

  let str = '';

  try {
    const { stdout, stderr } = await execa('solang', args);

    str += stdout;
    str += '\n';
    str += stderr;
    str += '\n';
  } catch (error) {
    console.log(error?.message);
  }

  const contractPaths = new Set<string>();

  const reg = /info:\sSaving\s(.*)\sfor\scontract?/g;
  let arr: RegExpExecArray;

  while ((arr = reg.exec(str)) !== null) {
    const filePath = arr[1].trim();
    contractPaths.add(filePath);
  }

  return Array.from(contractPaths).map((fullPath) => ({
    name: path.basename(fullPath),
    contract: fullPath
  }));
}
