import { patract } from "redspot";

const { getContractFactory } = patract!;

async function run() {
  const flipperFactory = await getContractFactory("erc20");
  await flipperFactory.deploy(0, "1000000");
}

run().catch((err) => {
  console.log(err);
});
