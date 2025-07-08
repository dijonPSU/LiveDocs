const handleSignIn = () => {
  window.location.href = "http://localhost:3000/auth/google";
};

const userLogout = async () => {
  const response = await fetch("http://localhost:3000/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Logout failed");
  }
  return response.json();
};

export { userLogout, handleSignIn };
