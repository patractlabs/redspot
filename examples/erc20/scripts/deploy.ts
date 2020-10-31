import { patract } from "redspot";

const { getContractFactory, disconnect } = patract!;

async function run() {
  const factory = await getContractFactory("erc20");
  const contract = await factory.deployed("new", "1000000");

  console.log("");
  console.log(
    "Deploy successfully. The contract address: ",
    contract.address.toString()
  );

  disconnect();
}

run().catch((err) => {
  console.log(err);
});
