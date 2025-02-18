import { Preview } from '../../components/docs/preview';
import { pages } from './example';

export default function CoreCookieBannerExample() {
	return (
		<Preview
			name="core-cookie-banner"
			code={pages}
			defaultFile="index.html"
			template="static"
		/>
	);
}
