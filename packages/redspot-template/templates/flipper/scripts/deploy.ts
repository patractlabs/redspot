import { patract } from "redspot";

const { getContractFactory } = patract!;

async function run() {
  const flipperFactory = await getContractFactory("flipper");
  await flipperFactory.deploy(0, false);
}

run().catch((err) => {
  console.log(err);
});
