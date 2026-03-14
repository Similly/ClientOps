import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/requests/:path*",
    "/documents/:path*",
    "/settings/:path*",
  ],
};
