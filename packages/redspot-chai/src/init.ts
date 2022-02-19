import path from 'path';
import chaiAsPromised from 'chai-as-promised'

export function init(projectRoot: string) {
  try {
    let chaiPath = require.resolve('chai');

    // When using this plugin linked from sources, we'd end up with the chai
    // used to test it, not the project's version of chai, so we correct it.
    if (chaiPath.startsWith(path.join(__dirname, '..', 'node_modules'))) {
      chaiPath = require.resolve('chai', {
        paths: [projectRoot]
      });
    }

    const chai = require(chaiPath);
    const { patractChai } = require('./chai');
    chai.use(patractChai);
    chai.use(chaiAsPromised);
  } catch (error) {
    // If chai isn't installed we just don't initialize the matchers
  }
}
