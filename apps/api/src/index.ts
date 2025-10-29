import app from "./app";

async function start() {
  try {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}...`);
    });
  } catch (err) {
    process.exit(1);
  }
}

start();
