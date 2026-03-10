import {z} from 'zod';

function unwrapType(t: z.ZodTypeAny): z.ZodTypeAny {
	const def = t._def as Record<string, unknown>;
	if (def['innerType']) return unwrapType(def['innerType'] as z.ZodTypeAny);
	if (def['schema']) return unwrapType(def['schema'] as z.ZodTypeAny);
	return t;
}

function getFieldKind(t: z.ZodTypeAny): 'boolean' | 'number' | 'string' {
	const inner = unwrapType(t);
	const typeName = (inner._def as {typeName?: string}).typeName;
	if (typeName === 'ZodBoolean') return 'boolean';
	if (typeName === 'ZodNumber') return 'number';
	return 'string';
}

export type ParseFlagsResult = {
	flags: Record<string, unknown>;
	positional: string[];
	error: string | null;
};

export function parseFlags(
	tokens: string[],
	schema: z.ZodObject<z.ZodRawShape>,
): ParseFlagsResult {
	const shape = schema.shape;
	const raw: Record<string, unknown> = {};
	const positional: string[] = [];
	let i = 0;

	while (i < tokens.length) {
		const token = tokens[i]!;
		if (token.startsWith('--')) {
			const eqIdx = token.indexOf('=');
			if (eqIdx !== -1) {
				const key = token.slice(2, eqIdx);
				const val = token.slice(eqIdx + 1);
				const kind = shape[key] ? getFieldKind(shape[key]!) : 'string';
				raw[key] = kind === 'number' ? Number(val) : val;
				i++;
			} else {
				const key = token.slice(2);
				const kind = shape[key] ? getFieldKind(shape[key]!) : 'string';
				if (kind === 'boolean') {
					raw[key] = true;
					i++;
				} else {
					const next = tokens[i + 1];
					if (next !== undefined && !next.startsWith('-')) {
						raw[key] = kind === 'number' ? Number(next) : next;
						i += 2;
					} else {
						raw[key] = true;
						i++;
					}
				}
			}
		} else {
			positional.push(token);
			i++;
		}
	}

	try {
		return {flags: schema.parse(raw) as Record<string, unknown>, positional, error: null};
	} catch (err) {
		if (err instanceof z.ZodError) {
			const msg = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
			return {flags: schema.parse({}) as Record<string, unknown>, positional, error: msg};
		}

		return {flags: schema.parse({}) as Record<string, unknown>, positional, error: String(err)};
	}
}
