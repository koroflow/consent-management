import { Preview } from '~/components/docs/preview';
import { pages } from './example-page';

export default function DialogExample() {
	return <Preview name="dialog" code={pages} height={500} />;
}
