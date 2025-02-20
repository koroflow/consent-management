import { Preview } from '~/components/docs/preview';
import { pages } from './example-page';

export default function UseConsentManagerExample() {
	return <Preview name="sandbox" code={pages} />;
}
