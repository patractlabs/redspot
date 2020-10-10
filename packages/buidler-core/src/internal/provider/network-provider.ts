import { WsProvider } from "@polkadot/rpc-provider";
import { NetworkConfigAccounts, INetworkProvider } from "../../types";

export class NetworkProvider extends WsProvider implements INetworkProvider {
  public accounts: NetworkConfigAccounts;
  public endowment: string | number;
  public gasLimit: string | number;
  public networkName: string;

  constructor(
    networkName: string,
    endpoint: string | string[],
    autoConnectMs: number | false,
    httpHeaders: Record<string, string>,
    accounts: NetworkConfigAccounts,
    endowment: string | number,
    gasLimit: string | number
  ) {
    super(endpoint, autoConnectMs, httpHeaders);
    this.networkName = networkName;
    this.accounts = accounts;
    this.endowment = endowment;
    this.gasLimit = gasLimit;
  }
}
