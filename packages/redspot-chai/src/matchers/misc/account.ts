import { Signer } from 'redspot/provider/signer';
import Contract from '@redspot/patract/contract';

export type Account = Signer | Contract;

export function isSigner(account: Account): account is Signer {
  return account instanceof Signer;
}

export function isContract(account: Account): account is Contract {
  return account instanceof Contract;
}

export async function getAddressOf(account: Account) {
  if (isSigner(account)) {
    return account.address;
  } else if (isContract(account)) {
    return account.signer.address;
  }
  throw new TypeError('Could not get the address of the account');
}
