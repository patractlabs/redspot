import { patract } from "redspot/internal/lib/redspot-lib";

describe("Flipper Contract", () => {
  let contract;

  beforeEach(async () => {
    const { getContractFactory } = patract;
    const fac = await getContractFactory("flipper");

    contract = await fac.deployed(0, false);
  });

  test("Putcode", () => {
    contract.get();
  });
});
