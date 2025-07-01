const httpOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export { httpOptions };
