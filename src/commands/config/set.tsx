import {Text} from 'ink';
import {z} from 'zod';

export const args = z.tuple([z.string().describe('key'), z.string().describe('value')]);
export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	args: z.infer<typeof args>;
	options: z.infer<typeof options>;
};

export default function ConfigSet({args: [key]}: Props) {
	return <Text color="red">Unknown config key: {key}. Use `timberlogs login` to authenticate.</Text>;
}
