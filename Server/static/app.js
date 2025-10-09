// Define APIs dynamically
        const apis = [
            { method: "GET", path: "/api/utils/menu-items", desc: "Fetch hierarchy tree" },
            { method: "POST", path: "/api/utils/login-access", desc: "Login (username + password)", body: { username: "admin", password: "1234" }},
            { method: "POST", path: "/api/hdl/upload-dat", desc: "Upload a DAT file", file: "datFile" },
            { method: "POST", path: "/api/hdl/upload-excel", desc: "Upload an Excel file", file: "excelFile" },
            { method: "POST", path: "/api/hdl/upload", desc: "Upload both DAT + Excel", file: ["datFile", "excelFile"] },
            { method: "POST", path: "/api/hdl/apply-transformation-and-download", desc: "Transform Excel", form: ["attribute_column", "raw_excel_file"] },
            { method: "GET", path: "/api/hdl/status/{customerName}/{instanceName}/{request_id}", desc: "Get HDL job status" },
            { method: "GET", path: "/api/customers", desc: "Get all customers" },
            { method: "GET", path: "/api/customers/{customer_name}", desc: "Get a specific customer" },
            { method: "GET", path: "/api/customers/{customer_name}/instances", desc: "Get all instances for a customer" },
            { method: "GET", path: "/api/customers/{customer_name}/instances/{instance_name}", desc: "Get a specific instance" },
            { method: "POST", path: "/api/customers/{customer_name}", desc: "Create or update a customer", body: { name: "test_customer" }},
            { method: "POST", path: "/api/customers/{customer_name}/instances", desc: "Create a new instance for a customer", body: { instance_name: "test_instance", config: { key: "value" }}},
            { method: "DELETE", path: "/api/customers/{customer_name}/instances/{instance_name}", desc: "Delete a specific instance" },
            { method: "DELETE", path: "/api/customers", desc: "Delete all customers" },
            { method: "DELETE", path: "/api/customers/{customer_name}", desc: "Delete a specific customer" }
        ];

// Build the table rows
const tableBody = document.getElementById("api-list");

apis.forEach((api, i) => {
  const row = document.createElement("tr");

  // Method coloring
  const methodColor = api.method === "GET" ? "#27ae60" : "#2980b9";

  row.innerHTML = `
    <td><b style="color:${methodColor}">${api.method}</b></td>
    <td><code>${api.path}</code></td>
    <td>${api.desc}</td>
    <td id="inputs-${i}"></td>
    <td><button onclick="callApi(${i})">Try It</button></td>
    <td>
      <div><b>Status:</b> <span id="status-${i}" style="color:#888">-</span></div>
      <pre id="output-${i}"></pre>
    </td>
  `;

  tableBody.appendChild(row);

  // Add inputs dynamically
  const inputDiv = document.getElementById(`inputs-${i}`);
  if (api.body) {
    inputDiv.innerHTML = `<textarea id="body-${i}" rows="4">${JSON.stringify(api.body, null, 2)}</textarea>`;
  }
  if (api.file) {
    if (Array.isArray(api.file)) {
      api.file.forEach(f => inputDiv.innerHTML += `<label>${f}: <input type="file" id="${f}-${i}"></label><br>`);
    } else {
      inputDiv.innerHTML = `<label>${api.file}: <input type="file" id="${api.file}-${i}"></label>`;
    }
  }
  if (api.form) {
    api.form.forEach(f => {
      if (f.includes("file")) {
        inputDiv.innerHTML += `<label>${f}: <input type="file" id="${f}-${i}"></label><br>`;
      } else {
        inputDiv.innerHTML += `<input type="text" placeholder="${f}" id="${f}-${i}"><br>`;
      }
    });
  }
});

// Call API
async function callApi(i) {
  const api = apis[i];
  let options = { method: api.method };

  if (api.body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = document.getElementById(`body-${i}`).value;
  }

  if (api.file || api.form) {
    const formData = new FormData();
    if (api.file) {
      if (Array.isArray(api.file)) {
        api.file.forEach(f => {
          const fileInput = document.getElementById(`${f}-${i}`);
          if (fileInput.files.length > 0) formData.append(f, fileInput.files[0]);
        });
      } else {
        const fileInput = document.getElementById(`${api.file}-${i}`);
        if (fileInput.files.length > 0) formData.append(api.file, fileInput.files[0]);
      }
    }
    if (api.form) {
      api.form.forEach(f => {
        const el = document.getElementById(`${f}-${i}`);
        if (f.includes("file")) {
          if (el.files.length > 0) formData.append(f, el.files[0]);
        } else {
          formData.append(f, el.value);
        }
      });
    }
    options.body = formData;
  }

  try {
    const res = await fetch(api.path, options);
    document.getElementById(`status-${i}`).textContent = `${res.status} ${res.statusText}`;

    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
      document.getElementById(`output-${i}`).textContent = JSON.stringify(data, null, 2);
    } else {
      data = await res.text();
      document.getElementById(`output-${i}`).textContent = data;
    }
  } catch (err) {
    document.getElementById(`status-${i}`).textContent = "Error";
    document.getElementById(`output-${i}`).textContent = "❌ " + err;
  }
}
