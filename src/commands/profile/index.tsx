import {z} from 'zod';
import ProfileList from './list.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ProfileIndex({options}: Props) {
	return <ProfileList options={options} />;
}
