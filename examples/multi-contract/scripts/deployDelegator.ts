import { patract, network, artifacts } from 'redspot';

const { getContractFactory } = patract;
const { createSigner, keyring, api } = network;

async function run() {
  await api.isReady;

  // The redspot signer supports passing in an address. If you want to use  substrate uri, you can do it like this:
  // const signer = createSigner(keyring.createFromUri("bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice"));
  // Or get the configured account from redspot config:
  // const signer = (await getSigners())[0]
  const signer = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice Address

  const balance = await api.query.system.account(signer);

  console.log('Balance: ', balance.toHuman());

  // Since the putcode interface was removed, need to upload hash via the deployment contract
  const accumulatorFactory = await getContractFactory('accumulator', signer);
  const accumulator = await accumulatorFactory.deployed('new', '1000');

  // Since the putcode interface was removed, need to upload hash via the deployment contract
  const adderFactory = await getContractFactory('adder', signer);
  const adder = await adderFactory.deployed('new', accumulator.address);

  // Since the putcode interface was removed, need to upload hash via the deployment contract
  const subberFactory = await getContractFactory('subber', signer);
  const subber = await subberFactory.deployed('new', accumulator.address);

  const contractFactory = await getContractFactory('delegator', signer);

  // Salt for adder,subber,accumulator deployment
  const randomVersion = Math.floor(Math.random() * 10000);

  const contract = await contractFactory.deploy(
    'new',
    1000,
    randomVersion,
    accumulator.abi.info.source.wasmHash,
    adder.abi.info.source.wasmHash,
    subber.abi.info.source.wasmHash,
    {
      gasLimit: '400000000000',
      value: '20000 UNIT'
    }
  );

  console.log('');
  console.log(
    'Deploy successfully. The contract address: ',
    contract.address.toString()
  );

  api.disconnect();
}

run().catch((err) => {
  console.log(err);
  process.exit(1);
});
