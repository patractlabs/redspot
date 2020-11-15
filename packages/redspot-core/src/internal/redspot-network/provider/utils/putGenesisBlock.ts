import Common from 'ethereumjs-common';

import { RedspotBlockchain } from '../RedspotBlockchain';
import { Block } from '../types/Block';

export async function putGenesisBlock(
  blockchain: RedspotBlockchain,
  common: Common
) {
  const genesisBlock = new Block(null, { common });
  genesisBlock.setGenesisParams();
  await blockchain.addBlock(genesisBlock);
}
