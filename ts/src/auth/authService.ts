import { scramLogin } from 'auth/scram'
import { client } from 'client'

export type AuthState = 'unknown' | 'guest' | 'authed'

/**
 * 用用户名/密码登录。
 * 登录前先清一次 session：FIN 的 /user/auth 在已有有效 session 时 HELLO 会直接短路成功、
 * 跳过密码校验，不先登出的话任何密码都能以旧 session 用户的身份"登录成功"。
 */
export async function login(username: string, password: string): Promise<void> {
	await fetch('/user/logout', { credentials: 'same-origin' }).catch(
		() => undefined
	)
	await scramLogin(username, password)
}

export async function logout(): Promise<void> {
	await fetch('/user/logout', { credentials: 'same-origin' })
}

/** 探测当前浏览器是否已持有有效 session（走一次受保护的标准 Haystack about 调用） */
export async function checkSession(): Promise<boolean> {
	try {
		await client.ops.about()
		return true
	} catch {
		return false
	}
}
