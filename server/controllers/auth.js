import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();

/**
 * Initializes Passport.js with Google OAuth strategy and user serialization
 * @description Sets up Google OAuth authentication strategy
 */
function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                image: profile.photos[0].value,
                accessToken,
                refreshToken: refreshToken ?? "",
              },
            });
          }
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

export default initPassport;
