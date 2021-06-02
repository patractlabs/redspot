import { expect } from 'chai';
import { artifacts, network, patract } from 'redspot';

const { getContractFactory, getRandomSigner, Contract } = patract;

const { api, getAddresses, getSigners } = network;

let signer: string;
let accumulator: typeof Contract;
let adder: typeof Contract;
let subber: typeof Contract;
let delegator: typeof Contract;

describe('Delegator', () => {
  after(() => {
    return api.disconnect();
  });

  before(async () => {
    await api.isReady;
    const signerAddresses = await getAddresses();
    signer = signerAddresses[0];
  });

  it('deploy accumulator', async () => {
    const accumulatorFactory = await getContractFactory('accumulator', signer);
    accumulator = await accumulatorFactory.deploy('new', '1000');

    expect(accumulator.address).to.exist;
  });

  it('accumulator inc', async () => {
    expect((await accumulator.query.get()).output).to.equal(1000);
    await accumulator.tx.inc(1);
    expect((await accumulator.query.get()).output).to.equal(1001);
  });

  it('deploy adder', async () => {
    const adderFactory = await getContractFactory('adder', signer);
    adder = await adderFactory.deploy('new', accumulator.address);

    expect(adder.address).to.exist;
  });

  it('adder inc', async () => {
    await adder.tx.inc(2);
    expect((await accumulator.query.get()).output).to.equal(1003);
  });

  it('deploy subber', async () => {
    const subberFactory = await getContractFactory('subber', signer);
    subber = await subberFactory.deploy('new', accumulator.address);

    expect(subber.address).to.exist;
  });

  it('subber dec', async () => {
    await subber.tx.dec(4);
    expect((await accumulator.query.get()).output).to.equal(999);
  });

  it('deploy delegator', async () => {
    // Salt for adder,subber,accumulator deployment
    const randomVersion = Math.floor(Math.random() * 10000);

    const delegatorFactory = await getContractFactory('delegator', signer);
    delegator = await delegatorFactory.deploy(
      'new',
      1000,
      randomVersion,
      accumulator.abi.project.source.wasmHash,
      adder.abi.project.source.wasmHash,
      subber.abi.project.source.wasmHash
    );

    expect(delegator.address).to.exist;
  });

  it('delegator change and switch', async () => {
    expect((await delegator.query.get()).output).to.equal(1000);
    // await delegator.tx.change(1);
    // expect((await delegator.query.get()).output).to.equal(1001);
    // await delegator.tx.change(-2);
    // expect((await delegator.query.get()).output).to.equal(999);
    // await delegator.tx.switch();
    // await delegator.tx.change(-2);
    // expect((await delegator.query.get()).output).to.equal(1001);
  });
});
