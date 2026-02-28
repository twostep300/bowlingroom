'use server';

import { handleServerFunctions } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap';

export async function payloadServerFunction(args: { name: string; args: Record<string, unknown> }) {
  const runtimeConfig = import('../../payload.config.js').then((mod) => mod.default);
  return handleServerFunctions({ ...args, config: runtimeConfig, importMap });
}

