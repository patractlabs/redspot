import { patract } from "redspot/internal/lib/redspot-lib";

const { getContractFactory, getSigners, getRandomSigner } = patract!;

async function run() {
  const signers = await getSigners();
  const signer = await getRandomSigner(signers[0], "25001600000");

  const flipperFactory = await getContractFactory("flipper", signer);
  const codeHash = await flipperFactory.putCode({
    signer: signers[0],
  });
  await flipperFactory.instantiate(codeHash, 0, true, {
    gasLimit: 5000000000,
  });

  patract.disconnect();
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
