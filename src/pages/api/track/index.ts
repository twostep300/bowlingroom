import type { APIRoute } from 'astro';
import { POST as trackPost } from '../tracking/index';

export const POST: APIRoute = async (context) => trackPost(context);
