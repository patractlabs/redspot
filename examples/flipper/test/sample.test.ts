import { expect } from "chai";
import { api } from "redspot/internal/lib/buidler-lib";

describe("Flipper", function () {
  it("flipper", async function () {
    await api.isReady;

    const accounts = await api.getPairs();
    const Alice = accounts[0];
    const flipperAbi = api.getAbi("flipper");
    const codeHash = await api.contract.putCode("flipper", Alice);
    // const contractAddress = await api.contract.deploy(
    //   Bob,
    //   codeHash,
    //   flipperAbi.constructors[0](true)
    // );

    const contract = api.getContract(
      flipperAbi,
      "5FdZNeVmTVf1Tz6cNtkWSaQeZTqg3qipS1K5dtqaYsyC6Vet"
    );

    const currentValue = await contract
      .read(contract.abi.messages[1], "0", "1000000")
      .send(Alice.publicKey);

    console.log(currentValue);

    await contract
      .exec(contract.abi.messages[0], "0", "1000000")
      .signAndSend(Alice);

    const nextValue = await contract
      .read(contract.abi.messages[1], "0", "1000000")
      .send(Alice.publicKey);

    console.log(nextValue);
    // const greeter = await Greeter.deploy("Hello, world!");

    // await greeter.deployed();
    // expect(await greeter.greet()).to.equal("Hello, world!");

    // await greeter.setGreeting("Hola, mundo!");
    expect("hha").to.equal("hha");
  });
});
