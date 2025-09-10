// FRONT-END (CLIENT) JAVASCRIPT HERE
async function getData() {
  const res = await fetch("/api/appdata")
  const data = await res.json()
  const bucket = document.querySelector("#bucket-list")
  bucket.innerHTML = ""
  data.forEach(({ id, goal, cost, date, complete, save }) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${id}</td>
      <td>${goal ?? ""}</td>
      <td>${cost ?? ""}</td>
      <td>${Number.isFinite(date) ? date : ""}</td>
      <td>${Number.isFinite(complete) ? complete : ""}</td>
      <td>${Number.isFinite(save) ? Math.ceil(save) : ""}</td>
      <td><button class="upd-btn" data-id="${id}">Update</button></td>
      <td><button class="del-btn" data-id="${id}">Delete</button></td>
      `
    bucket.appendChild(tr)
  })
}

async function deleteG(id) {
  const res = await fetch("/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Number(id) })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.error || "Delete failed")
    return
  }
  await getData()
}

async function updateG(id) {
  const goalInput = prompt("Enter new goal (cancel to skip):");
  const costInput = prompt("Enter new cost (cancel to skip):");
  const dateInput = prompt("Enter new date (cancel to skip):");
  const load = { id };
  if (goalInput !== null && goalInput.trim() !== "") {
    load.goal = goalInput.trim();
  }
  if (costInput !== null && costInput.trim() !== "") {
    const cost = Number(costInput);
    if (!isNaN(cost)) load.cost = cost;
  }
  if (dateInput !== null && dateInput.trim() !== "") {
    const date = Number(dateInput);
    if (!isNaN(date)) load.date = date;
  }
  if (Object.keys(load).length === 1) {
    alert("You did not update anything!");
    return;
  }

  const res = await fetch("/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(load)
  });

  const data = await res.json();
  if (data.ok) {
    console.log("Updated successfully:", data.updated);
    await getData();
  } else {
    console.error("Update failed:", data.error);
    alert("Update failed: " + (data.error || "Unknown error"));
  }
}



const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()
  
  const goalSub = document.querySelector("#goal")
  const costSub  = document.querySelector("#cost")
  const dateSub   = document.querySelector("#date")

  const json = {
    goal: goalSub.value,
    cost: Number(costSub.value),
    date: Number(dateSub.value)
  }

  const response = await fetch( "/submit", {
    method:"POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json)
  })

  goalSub.value = ""
  costSub.value = ""
  dateSub.value = ""
  await getData()
}

window.onload = function() {
  const button = document.querySelector("button")
  button.onclick = submit
  const bucket = document.querySelector("#bucket-list")
  bucket.addEventListener("click", (e) => {
    const btn = e.target.closest(".del-btn")
    if (btn) {
      deleteG(btn.dataset.id)
      return
    }
    const updBtn = e.target.closest(".upd-btn")
    if (updBtn) {
      updateG(updBtn.dataset.id)
      return
    }
  })
  getData()
}