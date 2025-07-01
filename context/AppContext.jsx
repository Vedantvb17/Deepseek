"use client"
import { useUser } from "@clerk/nextjs";
import { createContext, useContext } from "react"

export const Appcontext = createContext();

export const useAppContext = () => {
    return useContext(Appcontext)
}

export const AppContextProvider = ({children}) =>{
    const {user} = useUser()

    const value = {
        user
    }

    return <Appcontext.Provider value={value}>{children}</Appcontext.Provider>
}