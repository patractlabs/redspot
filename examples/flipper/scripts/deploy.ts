import { patract } from "redspot/internal/lib/redspot-lib";

const { getContractFactory, getSigners, getRandomSigner } = patract!;

async function run() {
  const signers = await getSigners();
  const signer = await getRandomSigner(signers[0], "50000000000000");
  const flipperFactory = await getContractFactory("flipper", signer);
  await flipperFactory.deployed(0, true, {
    value: 10010000000,
    gasLimit: 50000000000,
  });
}

run().catch((err) => {
  console.log(err);
});

// process.on('unhandledRejection', (reason: any, p) => {
//   console.log('Unhandled Rejection at: Promise', p, 'reason:')
//   console.dir(reason.stack)
//   // application specific logging, throwing an error, or other logic here
// });

// 5G1nKgFJSw8TdidwxXjJ8pqd32ztSQLPnAgQNwNoL9z1af2K
