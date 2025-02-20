import { Preview } from '~/components/docs/preview';
import { pages } from './example-page';

export default function TailwindCookieBannerExample() {
	return <Preview name="tailwind" code={pages} />;
}
