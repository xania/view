import https from "https";

export function fetchJson(requestOptions: string | https.RequestOptions | URL) {
  return new Promise<any>((resolve, reject) => {
    // Collect response data
    const req = https.get(requestOptions, (res) => {
      let data = "";

      // Collect response data
      res.on("data", (chunk) => {
        data += chunk;
      });

      // Process response data
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          console.log(data);
          reject(error);
        }
      });
    });

    // Handle any errors
    req.on("error", reject);

    // Send the request
    req.end();
  });
}
