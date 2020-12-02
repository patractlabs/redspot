import { GenericExtrinsic } from '@polkadot/types';
import Table from 'cli-table3';
import { Registry, WsProvider } from 'redspot/types';
import { GasReporterConfig } from '../types';

function average(nums: number[]) {
  return Math.floor(nums.reduce((a, b) => a + b) / nums.length);
}

export class TransactionWatcher {
  public start: number;

  #provider: WsProvider;
  #extrinsics: string[];

  #watchId: string | number;
  #registry: Registry;
  #abiMap: any;

  constructor(config: GasReporterConfig) {
    this.#abiMap = (config.abis || []).reduce((result, { contract, spec }) => {
      spec.messages.map((messages) => {
        result[messages.selector] = {
          message: messages.name[0],
          contract: contract.name
        };
      });

      return result;
    }, {});
    this.#provider = config.provider.clone();
    this.#registry = config.provider.registry;
    this.#extrinsics = [];
  }

  async ensureConnect() {
    if (!this.#provider.isConnected) {
      try {
        await this.#provider.connect();
      } catch {}
    }
  }

  async initialize() {
    await this.ensureConnect();
    this.#watchId = await this.#provider.subscribe(
      'chain_newHead',
      'chain_subscribeNewHeads',
      [],
      async (error, result) => {
        const hash = await this.#provider.send('chain_getBlockHash', [
          result.number
        ]);
        const block = await this.#provider.send('chain_getBlock', [hash]);
        this.#extrinsics = this.#extrinsics.concat(
          block.block.extrinsics.filter((s) => s.length > 24)
        );
      }
    );
  }

  async resolveData(): Promise<Record<string, number[]>> {
    const txs = this.#extrinsics
      .map((txdata) => {
        const extrinsic = new GenericExtrinsic(this.#registry, txdata);
        const { callIndex, args } = extrinsic.method.toJSON() as any;

        return {
          bytes: txdata,
          tip: extrinsic.tip.toString(),
          method: extrinsic.method.methodName,
          section: extrinsic.method.sectionName,
          signer: extrinsic.isSigned ? extrinsic.signer.toString() : null,
          id: args?.data?.slice(0, 10),
          callIndex,
          args
        };
      })
      .filter(({ section, method }) => {
        return section === 'contracts' && method === 'call';
      });

    const _gasData = await Promise.all(
      txs.map(async (tx) => {
        try {
          const result = await this.#provider.send('contracts_call', [
            {
              origin: tx.signer,
              dest: tx.args.dest,
              value: tx.args.value,
              gasLimit: tx.args.gas_limit,
              inputData: tx.args.data
            }
          ]);

          return {
            ...tx,
            result
          };
        } catch (error) {
          return undefined;
        }
      })
    );

    const gasData = _gasData.filter((data) => {
      return data && !data.result.debugMessage && data.result.result.Ok;
    });

    return gasData
      .map((data) => {
        return {
          gasConsumed: data.result.gasConsumed,
          id: data.id
        };
      })
      .reduce((r, c) => {
        r[c.id] = r[c.id] ? r[c.id].concat(c.gasConsumed) : [c.gasConsumed];
        return r;
      }, {});
  }

  generate(data: Record<string, number[]>) {
    const table = new Table({
      head: ['Contract', 'Message', 'Min', 'Max', 'Avg', 'Calls']
    });

    table.push(
      ...Object.keys(data).map((key) => {
        if (!this.#abiMap[key]) {
          return [];
        }

        const { contract, message } = this.#abiMap[key];
        const min = Math.min(...data[key]);
        const max = Math.max(...data[key]);
        const avg = average(data[key]);

        return [contract, message, min, max, avg, data[key].length];
      })
    );

    return table.toString();
  }

  async getTable() {
    const data = await this.resolveData();
    const table = this.generate(data);

    return table;
  }

  async stop() {
    await this.#provider.unsubscribe(
      'chain_newHead',
      'chain_unsubscribeNewHead',
      this.#watchId
    );
  }
}
