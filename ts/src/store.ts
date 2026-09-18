import { makeAutoObservable } from 'mobx'
import { createContext } from 'react'

export class Store {
	constructor() {
		makeAutoObservable(this)
	}
}

export const StoreContext = createContext<Store>(new Store())
