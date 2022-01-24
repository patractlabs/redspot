import { extendEnvironment } from 'redspot/config';
import { CustomBalance } from './balance';
import { getTypeLength } from './getTypeLength';
import { CustomWeight } from './weight';

extendEnvironment((env) => {
  const api = env.network.api;

  api.once('ready', async () => {
    const decimals: number = api.registry.chainDecimals[0];
    const Balance = api.registry.getDefinition('Balance');
    const Weight = api.registry.getDefinition('Weight');

    api.registerTypes({
      Weight: CustomWeight.with(decimals, getTypeLength(Weight || 'u64')),
      u128: CustomBalance.with(
        decimals,
        getTypeLength(Balance || 'UInt<128, Balance>')
      ),
      Balance: CustomBalance.with(
        decimals,
        getTypeLength(Balance || 'UInt<128, Balance>')
      ),
      BalanceOf: CustomBalance.with(
        decimals,
        getTypeLength(Balance || 'UInt<128, Balance>')
      )
    });
  });
});
