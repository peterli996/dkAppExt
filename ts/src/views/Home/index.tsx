import React, { useEffect, useState } from 'react'
import { useClient } from 'haystack-react'

const Home = () => {
	const client = useClient()
	const [result, setResult] = useState('')

	useEffect(() => {
		client.ext.eval('readAll(equip and chiller)').then((grid) => {
			console.log(grid.toString());
			const chillerList=grid.getRows().map((row)=>row.get('navName')?.toString()??'')
			setResult(chillerList.join('\n'))
		})
	}, [client])

	return (
		<div>
			<pre>{result}</pre>
		</div>
	)
}

export default Home
