import { TypeRegistry } from "@polkadot/types";
import BN from "bn.js";
import { IRpcProvider, NetworkConfigAccounts } from "../../types";
import registry from "./registry";
import WsProvider from "./ws-provider";

export class RpcProvider extends WsProvider implements IRpcProvider {
  public accounts: NetworkConfigAccounts;
  public endowment: BN;
  public gasLimit: BN;
  public networkName: string;
  public registry: TypeRegistry;

  constructor(
    networkName: string,
    endpoint: string | string[] = "ws://127.0.0.1:9944",
    types: Record<string, any> = {},
    httpHeaders: Record<string, string>,
    accounts: NetworkConfigAccounts = [
      "//Alice",
      "//Bob",
      "//Charlie",
      "//Dave",
      "//Eve",
      "//Ferdie",
    ],
    endowment: BN | number | string = "5000000000000",
    gasLimit: BN | number | string = "50000000000"
  ) {
    super(endpoint, httpHeaders);
    this.networkName = networkName;
    this.accounts = accounts;
    this.endowment = new BN(endowment);
    this.gasLimit = new BN(gasLimit);
    this.registry = registry;

    this.registry.setKnownTypes({
      types,
    });
  }
}
