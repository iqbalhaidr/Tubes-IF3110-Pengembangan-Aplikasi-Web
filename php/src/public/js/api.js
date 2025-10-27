window.api = {
    request(method, url, body = null) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
  
        if (!(body instanceof FormData)) {
          xhr.setRequestHeader("Content-Type", "application/json");
        }
  
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(response);
              } else {
                reject(response);
              }
            } catch (e) {
              reject({ success: false, message: "Invalid JSON response" });
            }
          }
        };
  
        xhr.onerror = function () {
          reject({ success: false, message: "Network error occurred" });
        };
  
        if (body instanceof FormData) {
          xhr.send(body);
        } else if (body) {
          xhr.send(JSON.stringify(body));
        } else {
          xhr.send();
        }
      });
    },
  
    get(url) {
      return this.request("GET", url);
    },
  
    post(url, body) {
      return this.request("POST", url, body);
    },
  
    put(url, body) {
      return this.request("PUT", url, body);
    },
  
    delete(url) {
      return this.request("DELETE", url);
    },
  };
  