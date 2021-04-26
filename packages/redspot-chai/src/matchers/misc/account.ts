import { Signer } from 'redspot/provider/signer';
import Contract from '@redspot/patract/contract';

export type Account = Signer | Contract | string;

export function isSigner(account: Account): account is Signer {
  return account instanceof Signer;
}

export function isContract(account: Account): account is Contract {
  return account instanceof Contract;
}

export function isAddress(account: Account): account is string {
  return typeof account === 'string';
}

export async function getAddressOf(account: Account) {
  if (isSigner(account)) {
    return account.address;
  } else if (isContract(account)) {
    return account.signer;
  } else if (isAddress(account)) {
    return account;
  }
  throw new TypeError('Could not get the address of the account');
}
