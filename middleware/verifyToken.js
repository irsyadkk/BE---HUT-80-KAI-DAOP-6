import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);

  // Format token harus: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];
  console.log("Masuk verify token:", { token });

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Forbidden

    console.log("Token valid, payload:", decoded);

    req.user = decoded; // berisi NIPP, NAMA, id, dsb
    next();
  });
};
