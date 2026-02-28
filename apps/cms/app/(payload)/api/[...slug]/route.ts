import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes';
const getConfigPromise = () => import('../../../../payload.config.js').then((mod) => mod.default);

export const GET = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_GET(getConfigPromise())(request, args);
export const POST = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_POST(getConfigPromise())(request, args);
export const DELETE = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_DELETE(getConfigPromise())(request, args);
export const PATCH = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_PATCH(getConfigPromise())(request, args);
export const PUT = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_PUT(getConfigPromise())(request, args);
export const OPTIONS = async (request: Request, args: { params: Promise<{ slug: string[] }> }) => REST_OPTIONS(getConfigPromise())(request, args);
