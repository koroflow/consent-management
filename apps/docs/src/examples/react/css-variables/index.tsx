import { Preview } from '~/components/docs/preview';
import { pages } from './example-page';

export default function CSSCookieBannerExample() {
	return <Preview name="css" code={pages} />;
}
