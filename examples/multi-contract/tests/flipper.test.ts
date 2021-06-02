import { expect } from 'chai';
import { artifacts, network, patract } from 'redspot';

const { getContractFactory, getRandomSigner } = patract;

const { api, getAddresses, getSigners } = network;

async function setup() {
  await api.isReady;
  const signerAddresses = await getAddresses();
  const Alice = signerAddresses[0];
  const contractFactory = await getContractFactory('flipper', Alice);

  return { contractFactory, Alice };
}

describe('Flipper', () => {
  after(() => {
    return api.disconnect();
  });

  it('deploy flipper with initValue', async () => {
    const { contractFactory } = await setup();
    const contract = await contractFactory.deploy('new', true);

    const result = await contract.query.get();

    expect(result.output).to.equal(true);
  });

  it('flipper it', async () => {
    const { contractFactory } = await setup();
    const contract = await contractFactory.deploy('new', false);

    const beforeResult = await contract.query.get();

    expect(beforeResult.output).to.equal(false);

    await contract.tx.flip();

    const afterFlipResult = await contract.query.get();

    expect(afterFlipResult.output).to.equal(true);
  });
});
