import {
  expandMetadata,
  GenericExtrinsic,
  Metadata,
  StorageKey
} from '@polkadot/types';
import Table from 'cli-table3';
import { Registry, WsProvider, AbiMetadata } from 'redspot/types';
import { GasReporterConfig } from '../types';

function average(nums: number[]) {
  return Math.floor(nums.reduce((a, b) => a + b) / nums.length);
}

export class TransactionWatcher {
  public start: number;

  #provider: WsProvider;
  #extrinsics: {
    index: number;
    number: string;
    hash: string;
    tx: string;
  }[];

  #watchId: string | number;
  #registry: Registry;
  #abiMap: any;

  constructor(config: GasReporterConfig) {
    this.#abiMap = (config.abis || []).reduce((result, data) => {
      const abiData = this.getAbiData(data)
      // Compatible with older version abi
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      abiData.spec.messages.forEach((messages) => {
        result[messages.selector] = {
          // name changed to label between V1 and V2
          message: messages.name ? messages.name[0] : messages.label[0],
          contract: data.contract.name
        };
      });

      return result;
    }, {});
    this.#provider = config.provider.clone();
    this.#registry = config.registry;
    this.#extrinsics = [];
  }

  getAbiData(data:AbiMetadata) {
    let abiData = data;
    // new styles
    // Find the different metadata version key, V1, V2, V3, etc.
    const storageKey = Object.keys(abiData).filter(key => key.search(/V\d/) > -1)
    if (storageKey.length) {
      abiData = abiData[storageKey[0]]
    }
    return abiData
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
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (error, result) => {
        if (error) return;
        const hash = await this.#provider.send('chain_getBlockHash', [
          result.number
        ]);
        const block = await this.#provider.send('chain_getBlock', [hash]);
        this.#extrinsics = this.#extrinsics.concat(
          block.block.extrinsics
            .map((s, index) => {
              return {
                index,
                number: result.number,
                hash: hash,
                tx: s
              };
            })
            .filter(({ tx }) => tx.length > 24)
        );
      }
    );
  }

  async getWeight(txs: any[]) {
    const data = await this.#provider.send('state_getMetadata', []);
    const metadata = expandMetadata(
      this.#registry,
      new Metadata(this.#registry, data)
    );

    const storageKey = new StorageKey(
      this.#registry,
      metadata.query.system.events
    );

    const blockHashs = new Set<string>();

    let result = [];

    for (const tx of txs) {
      if (!blockHashs.has(tx.blockHash)) {
        blockHashs.add(tx.blockHash);

        const raw = await this.#provider.send('state_getStorage', [
          storageKey.toHex(),
          tx.blockHash
        ]);

        const events = this.#registry.createType(
          storageKey.outputType as any,
          raw,
          true
        );

        const d = events
          .filter(
            (event) =>
              (event.phase.isEmpty ? null : event.phase.value.toNumber()) ===
              tx.index
          )
          .filter((event) => {
            const h = event.toHuman();
            return (
              h.event.method === 'ExtrinsicSuccess' ||
              h.event.method === 'ExtrinsicFailed'
            );
          })
          .map((event) => {
            const j = event.toJSON();
            return {
              ...tx,
              dispatchInfo: j.event.data[0]
            };
          });

        result = result.concat(d);
      }
    }

    return result;
  }

  getExtrinsics() {
    return this.#extrinsics
      .map((txdata) => {
        const extrinsic = new GenericExtrinsic(this.#registry, txdata.tx);
        const { callIndex, args } = extrinsic.method.toJSON();

        return {
          index: txdata.index,
          blockNumber: txdata.number,
          blockHash: txdata.hash,
          bytes: txdata.tx,
          tip: extrinsic.tip.toString(),
          method: extrinsic.method.method,
          section: extrinsic.method.section,
          signer: extrinsic.isSigned ? extrinsic.signer.toString() : null,
          id: args?.data?.slice(0, 10),
          callIndex,
          args
        };
      })
      .filter(({ section, method }) => {
        return section === 'contracts' && method === 'call';
      });
  }

  async getGas(txs: any[]) {
    return await Promise.all(
      txs.map(async (tx) => {
        try {
          const result = await this.#provider.send('contracts_call', [
            {
              origin: tx.signer,
              dest:
                typeof tx.args.dest === 'string'
                  ? tx.args.dest
                  : tx.args.dest.id,
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
  }

  async resolveData(): Promise<
    Record<
      string,
      {
        gasConsumed: number[];
        weight: number[];
      }
    >
  > {
    const _txs = this.getExtrinsics();
    const txsWithGas = await this.getGas(_txs);
    const txs = await this.getWeight(txsWithGas);

    const data = txs.filter((data) => {
      return data && !data.result.debugMessage && data.result.result.Ok;
    });

    return data
      .map((data) => {
        return {
          gasConsumed: data.result.gasConsumed,
          weight: data.dispatchInfo.weight,
          id: data.id
        };
      })
      .reduce((r, c) => {
        if (r[c.id]) {
          r[c.id] = {
            gasConsumed: r[c.id].gasConsumed.concat(c.gasConsumed),
            weight: r[c.id].weight.concat(c.weight)
          };
        } else {
          r[c.id] = {
            gasConsumed: [c.gasConsumed],
            weight: [c.weight]
          };
        }

        return r;
      }, {});
  }

  generate(
    data: Record<
      string,
      {
        gasConsumed: number[];
        weight: number[];
      }
    >
  ) {
    const table = new Table({
      style: { head: [], border: [] }
    });

    table.push(
      [
        '',
        '',
        { colSpan: 2, content: 'Min' },
        { colSpan: 2, content: 'Max' },
        { colSpan: 2, content: 'Avg' },
        ''
      ],
      [
        'Contract',
        'Message',
        'EstimateGas',
        'Weight',
        'EstimateGas',
        'Weight',
        'EstimateGas',
        'Weight',
        'Calls'
      ]
    );

    table.push(
      ...Object.keys(data).map((key) => {
        if (!this.#abiMap[key]) {
          return [];
        }

        const { contract, message } = this.#abiMap[key];
        const gas = {
          min: undefined,
          max: undefined,
          avg: undefined
        };

        const weight = {
          min: undefined,
          max: undefined,
          avg: undefined
        };

        gas.min = Math.min(...data[key].gasConsumed);
        gas.max = Math.max(...data[key].gasConsumed);
        gas.avg = average(data[key].gasConsumed);

        weight.min = Math.min(...data[key].weight);
        weight.max = Math.max(...data[key].weight);
        weight.avg = average(data[key].weight);

        return [
          contract,
          message,
          gas.min,
          weight.min,
          gas.max,
          weight.max,
          gas.avg,
          weight.avg,
          data[key].gasConsumed.length
        ];
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
