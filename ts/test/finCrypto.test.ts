import { sha256, hmacSha256, pbkdf2HmacSha256, rstr2hex, rstr2b64uri, str2rstrUtf8 } from 'auth/finCrypto'

// 官方标准测试向量，用来验证从 FIN 原生登录页 login.js 照搬过来的手写 SHA-256/HMAC/PBKDF2 实现字节级正确。
describe('finCrypto', () => {
	it('sha256("") matches known vector', () => {
		expect(rstr2hex(sha256(''))).toBe(
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
		)
	})

	it('sha256("abc") matches known vector', () => {
		expect(rstr2hex(sha256('abc'))).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
		)
	})

	it('hmacSha256 matches RFC 4231 test case 1', () => {
		const key = String.fromCharCode(0x0b).repeat(20)
		const data = 'Hi There'
		expect(rstr2hex(hmacSha256(key, data))).toBe(
			'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
		)
	})

	it('pbkdf2HmacSha256 matches RFC 7914 test vector (c=1)', () => {
		const dk = pbkdf2HmacSha256('password', 'salt', 1, 32)
		expect(rstr2hex(dk)).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b')
	})

	it('rstr2b64uri has no padding and is url-safe', () => {
		const encoded = rstr2b64uri(str2rstrUtf8('中文su'))
		expect(encoded).not.toMatch(/[=+/]/)
	})
})
