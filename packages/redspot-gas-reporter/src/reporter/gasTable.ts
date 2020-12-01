import Table from 'cli-table3';
import { Config } from './config';

export class GasTable {
  constructor(public config: Config) {}

  generate() {
    var table = new Table({
      head: ['Contract', 'Message', 'Min', 'Max', 'Avg', 'Calls']
    });
    table.push(['1', '2', 3, 4, 5, 6], ['1', '2', 3, 4, 5, 6]);
  }
}
