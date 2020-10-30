import { patract } from "redspot/internal/lib/redspot-lib";

const { getContractFactory, getSigners } = patract!;

async function run() {
  const signers = await getSigners();

  const flipperFactory = await getContractFactory("flipper", signers[0]);

  await flipperFactory.deployed(0, true, {
    gasLimit: 5000000000,
  });

  patract.disconnect();
}

run().catch((err) => {
  console.log(err);
});
