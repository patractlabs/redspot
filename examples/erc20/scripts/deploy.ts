import { patract, network } from "redspot";

const { getContractFactory } = patract;
const { createSigner, keyring, api } = network;

async function run() {
  await api.isReady;

  // The redspot signer supports passing in an address. If you want to use  substrate uri, you can do it like this:
  // const signer = createSigner(keyring.createFromUri("bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice"));
  // Or get the configured account from redspot config:
  // const signer = (await getSigners())[0]
  const signer = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice Address

  const contractFactory = await getContractFactory("erc20", signer);

  const balance = await api.query.system.account(signer);

  console.log("Balance: ", balance.toHuman());

  // The `deploy` method will attempt to deploy a new contract.
  // The `deployed` method will first find out if the same contract already exists based on the parameters.
  // If the contract exists, it will be returned, otherwise a new contract will be created.
  const contract = await contractFactory.deploy("new", "1000000", {
    gasLimit: "400000000000",
    value: "1000 UNIT",
  });

  console.log("");
  console.log(
    "Deploy successfully. The contract address: ",
    contract.address.toString()
  );

  api.disconnect();
}

run().catch((err) => {
  console.log(err);
});
