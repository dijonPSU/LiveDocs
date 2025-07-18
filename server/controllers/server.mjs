import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import initPassport from "../controllers/auth.js"; // ES import
import {
  createDocument,
  getDocuments,
  savePatch,
  getDocumentContent,
  updateSnapshot,
  shareDocument,
  getDocumentCollaborators,
  deleteDocument,
  getUserData,
  getUserProfiles,
  getVersions,
  revertVersion,
  updateDocumentTitle,
  getVersionContent,
} from "./documents.js";

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
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/callback?error=auth_failed",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/callback?success=true");
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

// Authenicated routes
app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
});

app.get("/documents", getDocuments);
app.get("/documents/:id/content", getDocumentContent);
app.get("/documents/:id/collaborators", getDocumentCollaborators);
app.get("/users/:id", getUserData);
app.get("/documents/:id/versions", getVersions);
app.get("/documents/:id/versions/:versionNumber", getVersionContent);
app.post("/documents", createDocument);
app.post("/documents/:id/patches", savePatch);
app.post("/documents/:id/share", shareDocument);
app.post("/users/profiles", getUserProfiles);
app.post("/documents/:id/revert", revertVersion);
app.put("/documents/:id/snapshot", updateSnapshot);
app.patch("/documents/:id", updateDocumentTitle);
app.delete("/documents/:id", deleteDocument);

app.get("/me", (req, res) => {
  res.json(req.user);
});

export default app;
