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
                  
                  if (!xhr.responseText || xhr.responseText.trim() === '') {
                      reject({ 
                          success: false, 
                          message: "Empty response from server" 
                      });
                      return;
                  }
                  
                  try {
                      const response = JSON.parse(xhr.responseText);
                      if (xhr.status >= 200 && xhr.status < 300) {
                          resolve(response);
                      } else {
                          reject(response);
                      }
                  } catch (e) {
                      console.error('JSON Parse Error:', e);
                      console.error('Received:', xhr.responseText.substring(0, 500));
                      
                      reject({ 
                          success: false, 
                          message: "Invalid JSON response", 
                          rawResponse: xhr.responseText.substring(0, 200)
                      });
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