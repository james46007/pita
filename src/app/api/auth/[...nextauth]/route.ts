import NextAuth from "next-auth"
import { authOptionsAdmin } from "@/lib/auth"

const handler = NextAuth(authOptionsAdmin)

export { handler as GET, handler as POST }
