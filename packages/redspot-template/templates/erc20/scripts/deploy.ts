import { patract, network } from 'redspot';

const { getContractFactory, disconnect } = patract;

const uri =
  'bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice';

const { connect, api } = patract!;

async function run() {
  await connect();

  const signer = network.provider.createSigner(
    network.provider.keyring.createFromUri(uri)
  );

  const contractFactory = await getContractFactory('erc20', signer);

  const balance = await api.query.system.account(signer.address);

  console.log('Balance: ', balance.toHuman());

  const contract = await contractFactory.deployed('new', '1000000', {
    gasLimit: '200000000000',
    value: '10000000000000000'
  });

  console.log('');
  console.log(
    'Deploy successfully. The contract address: ',
    contract.address.toString()
  );

  disconnect();
}

run().catch((err) => {
  console.log(err);
});
