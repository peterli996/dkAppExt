import React, { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { login } from 'auth/authService'
import background from 'images/background.png'
import styles from 'views/Login/index.module.less'

const whiteLabel = (text: string) => (
	<span className={styles.whiteLabel}>{text}</span>
)

interface LoginProps {
	onAuthed: () => void
}

interface LoginFormValues {
	username: string
	password: string
}

const Login = ({ onAuthed }: LoginProps) => {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleFinish = async (values: LoginFormValues) => {
		setLoading(true)
		setError('')
		try {
			await login(values.username, values.password)
			onAuthed()
		} catch (e) {
			setError(e instanceof Error ? e.message : '登录失败')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className={styles.page}
			style={{ backgroundImage: `url(${background})` }}>
			<Form<LoginFormValues>
				className={styles.card}
				layout='vertical'
				onFinish={handleFinish}>
				<h2 className={styles.title}>登录</h2>
				{error && (
					<Form.Item>
						<Alert type='error' message={error} showIcon />
					</Form.Item>
				)}
				<Form.Item
					name='username'
					label={whiteLabel('用户名')}
					rules={[{ required: true, message: '请输入用户名' }]}>
					<Input autoFocus />
				</Form.Item>
				<Form.Item
					name='password'
					label={whiteLabel('密码')}
					rules={[{ required: true, message: '请输入密码' }]}>
					<Input.Password />
				</Form.Item>
				<Form.Item>
					<Button
						type='primary'
						htmlType='submit'
						loading={loading}
						block>
						登录
					</Button>
				</Form.Item>
			</Form>
		</div>
	)
}

export default Login
