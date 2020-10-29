import { patract } from "redspot/internal/lib/redspot-lib";

const { getContractFactory, getSigners, getRandomSigner } = patract!;

async function run() {
  // const flipperFactory = await getContractFactory("flipper");
  // await flipperFactory.deployed(0, true);
  const signers = await getSigners();
  await getRandomSigner(signers[0], "100000000000");
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
