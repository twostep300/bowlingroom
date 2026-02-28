import * as migration_20260221_155551_init from './20260221_155551_init';

export const migrations = [
  {
    up: migration_20260221_155551_init.up,
    down: migration_20260221_155551_init.down,
    name: '20260221_155551_init'
  },
];
