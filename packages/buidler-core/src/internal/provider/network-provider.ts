import { WsProvider } from "@polkadot/rpc-provider";
import { NetworkConfigAccounts, INetworkProvider } from "../../types";

export class NetworkProvider extends WsProvider implements INetworkProvider {
  public accounts: NetworkConfigAccounts;
  public endowment: string | number;
  public gasLimit: string | number;
  public networkName: string;
  public types: Record<string, any>;

  constructor(
    networkName: string,
    endpoint: string | string[] = "ws://127.0.0.1:9944",
    types: Record<string, any> = {},
    autoConnectMs: number | false,
    httpHeaders: Record<string, string>,
    accounts: NetworkConfigAccounts = [
      "//Alice",
      "//Bob",
      "//Charlie",
      "//Dave",
      "//Eve",
      "//Ferdie",
    ],
    endowment: string | number = "5000000000000",
    gasLimit: string | number = "50000000000"
  ) {
    super(endpoint, autoConnectMs, httpHeaders);
    this.networkName = networkName;
    this.types = types;
    this.accounts = accounts;
    this.endowment = endowment;
    this.gasLimit = gasLimit;
  }
}
