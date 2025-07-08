import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import initPassport from "../controllers/auth.js"; // ES import
import { getDocuments } from "./documents.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

initPassport();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("http://localhost:5173/Homepage");
  },
);

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // clear cookie by your session name
      res.json({ message: "Logged out successfully" });
    });
  });
});

app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});


app.get("/documents", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try{
    const documents = await documents.getDocuments();
    return res.status(200).json(documents);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }

});

export default app;
