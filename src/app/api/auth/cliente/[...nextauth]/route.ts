import NextAuth from "next-auth"
import { authOptionsCliente } from "@/lib/auth-cliente"

const handler = NextAuth(authOptionsCliente)

export { handler as GET, handler as POST }
