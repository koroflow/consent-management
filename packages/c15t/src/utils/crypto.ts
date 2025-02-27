export function createHMAC(
	algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256',
	encoding: 'hex' | 'base64' | 'base64urlnopad' = 'hex'
) {
	const textEncoder = new TextEncoder();

	async function getKey(secret: string): Promise<CryptoKey> {
		const secretBuffer = textEncoder.encode(secret);
		return await crypto.subtle.importKey(
			'raw',
			secretBuffer,
			{ name: 'HMAC', hash: { name: algorithm } },
			false,
			['sign', 'verify']
		);
	}

	function encodeOutput(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);

		if (encoding === 'hex') {
			return Array.from(bytes)
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
		}

		if (encoding === 'base64') {
			if (typeof btoa === 'function') {
				return btoa(String.fromCharCode(...bytes));
			}

			// Node.js environment
			return Buffer.from(bytes).toString('base64');
		}

		if (encoding === 'base64urlnopad') {
			let base64 = '';

			if (typeof btoa === 'function') {
				base64 = btoa(String.fromCharCode(...bytes));
			} else {
				// Node.js environment
				base64 = Buffer.from(bytes).toString('base64');
			}

			// Convert to base64url format (replace +/ with -_ and remove padding)
			return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		}

		throw new Error(`Unsupported encoding: ${encoding}`);
	}

	return {
		async sign(secret: string, data: string): Promise<string> {
			const key = await getKey(secret);
			const dataBuffer = textEncoder.encode(data);
			const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
			return encodeOutput(signature);
		},

		async verify(
			secret: string,
			data: string,
			signature: string
		): Promise<boolean> {
			const key = await getKey(secret);
			const dataBuffer = textEncoder.encode(data);

			let signatureBuffer: ArrayBuffer;

			if (encoding === 'hex') {
				const bytes = new Uint8Array(signature.length / 2);
				for (let i = 0; i < signature.length; i += 2) {
					// Fix: Use parseInt instead of parseIntarseIntarseIntarseInt
					bytes[i / 2] = Number.parseInt(signature.substr(i, 2), 16);
				}
				signatureBuffer = bytes.buffer;
			} else if (encoding === 'base64' || encoding === 'base64urlnopad') {
				let base64 = signature;

				if (encoding === 'base64urlnopad') {
					// Convert from base64url to base64
					base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
					// Add padding if needed
					while (base64.length % 4) {
						base64 += '=';
					}
				}

				if (typeof atob === 'function') {
					const binary = atob(base64);
					const bytes = new Uint8Array(binary.length);
					for (let i = 0; i < binary.length; i++) {
						bytes[i] = binary.charCodeAt(i);
					}
					signatureBuffer = bytes.buffer;
				} else {
					// Node.js environment
					signatureBuffer = Buffer.from(base64, 'base64').buffer;
				}
			} else {
				throw new Error(`Unsupported encoding: ${encoding}`);
			}

			return await crypto.subtle.verify(
				'HMAC',
				key,
				signatureBuffer,
				dataBuffer
			);
		},
	};
}
