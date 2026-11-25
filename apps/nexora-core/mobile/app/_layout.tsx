import {Stack} from "expo-router";
import { StatusBar} from "expo-status-bar";

import { AuthProvider } from "@/src/providers/AuthProvider";


export default function RootLayout() {
    return (
        <AuthProvider>
            <statusbar style="auto"/>
            <Stack 
            screenOption ={{
                headerShown: false,
          contentStyle: { backgroundColor: "#F4F6FA" },
            }}
            />
       </AuthProvider>
    )
}
