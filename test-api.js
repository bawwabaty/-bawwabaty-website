import http from "http";

http.get("http://127.0.0.1:3000/api/not-exist", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("STATUS:", res.statusCode);
    console.log("HEADERS:", res.headers);
    console.log("BODY:", data.substring(0, 100));
  });
}).on("error", console.error);
