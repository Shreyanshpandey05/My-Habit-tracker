// Team Webify - Habit Tracker
// data is saved in localStorage (no backend needed)

var users = JSON.parse(localStorage.getItem("users")) || {};
var me = localStorage.getItem("me");
var habits = [];
var editId = null;
var signupMode = false;

function $(id) { return document.getElementById(id); }

// ---------- login / signup ----------
$("switchLink").onclick = function (e) {
  e.preventDefault();
  signupMode = !signupMode;
  $("authTitle").innerText = signupMode ? "📝 Sign Up" : "🔐 Login";
  $("authBtn").innerText = signupMode ? "Create Account" : "Login";
  $("switchLink").innerText = signupMode ? "Login" : "Sign up";
  $("authMsg").innerText = "";
};

$("authBtn").onclick = function () {
  var u = $("user").value.trim();
  var p = $("pass").value;

  if (u.length < 3) { $("authMsg").innerText = "Username needs at least 3 characters"; return; }
  if (p.length < 5) { $("authMsg").innerText = "Password needs at least 5 characters"; return; }

  if (signupMode) {
    if (users.hasOwnProperty(u)) { $("authMsg").innerText = "Username already taken"; return; }
    users[u] = p;
    localStorage.setItem("users", JSON.stringify(users));
  } else {
    if (!users.hasOwnProperty(u) || users[u] !== p) {
      $("authMsg").innerText = "Wrong username or password";
      return;
    }
  }
  me = u;
  localStorage.setItem("me", u);
  startApp();
};

$("logoutBtn").onclick = function () {
  localStorage.removeItem("me");
  location.reload();
};

function startApp() {
  $("authBox").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("welcome").innerText = "Hi " + me + "! 👋 Let's build some good habits.";
  habits = JSON.parse(localStorage.getItem("habits_" + me)) || [];
  $("hDate").value = today();
  showAll();
}

// ---------- tabs (open on hover, click works for phones) ----------
var tabs = document.querySelectorAll(".tab");
for (var i = 0; i < tabs.length; i++) {
  tabs[i].onmouseover = openTab;
  tabs[i].onclick = openTab;
}

function openTab() {
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
    $(tabs[i].dataset.tab).classList.remove("show");
  }
  this.classList.add("active");
  $(this.dataset.tab).classList.add("show");
}

// ---------- helpers ----------
function today() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function saveHabits() {
  localStorage.setItem("habits_" + me, JSON.stringify(habits));
}

// stops html being typed into the habit name
function clean(text) {
  var div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

var icons = { Health: "💧", Study: "📚", Fitness: "🏃", Personal: "🧘", Other: "⭐" };

// ---------- add / edit habit ----------
$("saveBtn").onclick = function () {
  var name = $("hName").value.trim();
  var date = $("hDate").value;

  if (name.length < 3) { $("formMsg").innerText = "Habit name needs at least 3 characters"; return; }
  if (date === "") { $("formMsg").innerText = "Please pick a date"; return; }
  if (editId === null && date < today()) { $("formMsg").innerText = "Date can't be in the past"; return; }

  if (editId === null) {
    habits.push({
      id: Date.now(), name: name, cat: $("hCat").value, pri: $("hPri").value,
      date: date, sch: $("hSch").value, status: "Pending"
    });
  } else {
    for (var i = 0; i < habits.length; i++) {
      if (habits[i].id === editId) {
        habits[i].name = name;
        habits[i].cat = $("hCat").value;
        habits[i].pri = $("hPri").value;
        habits[i].date = date;
        habits[i].sch = $("hSch").value;
      }
    }
  }
  resetForm();
  saveHabits();
  showAll();
};

$("cancelBtn").onclick = resetForm;

function resetForm() {
  editId = null;
  $("hName").value = "";
  $("hDate").value = today();
  $("formMsg").innerText = "";
  $("formTitle").innerText = "Add a new habit";
  $("saveBtn").innerText = "Save Habit";
  $("cancelBtn").classList.add("hidden");
}

function editHabit(id) {
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      var h = habits[i];
      $("hName").value = h.name;
      $("hCat").value = h.cat;
      $("hPri").value = h.pri;
      $("hDate").value = h.date;
      $("hSch").value = h.sch;
    }
  }
  editId = id;
  $("formTitle").innerText = "Edit habit";
  $("saveBtn").innerText = "Update Habit";
  $("cancelBtn").classList.remove("hidden");
  tabs[0].click();
}

function deleteHabit(id) {
  if (!confirm("Delete this habit?")) return;
  habits = habits.filter(function (h) { return h.id !== id; });
  saveHabits();
  showAll();
}

// pending -> in progress -> done -> pending
function changeStatus(id) {
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      var s = habits[i].status;
      habits[i].status = s === "Pending" ? "In Progress" : s === "In Progress" ? "Done" : "Pending";
    }
  }
  saveHabits();
  showAll();
}

// ---------- list (search, filter, sort) ----------
$("search").oninput = showList;
$("fCat").onchange = showList;
$("fStatus").onchange = showList;
$("sortBy").onchange = showList;

function showList() {
  var text = $("search").value.toLowerCase();
  var cat = $("fCat").value;
  var st = $("fStatus").value;
  var order = { High: 1, Medium: 2, Low: 3 };

  var list = habits.filter(function (h) {
    return h.name.toLowerCase().indexOf(text) !== -1 &&
      (cat === "All" || h.cat === cat) &&
      (st === "All" || h.status === st);
  });

  var by = $("sortBy").value;
  list.sort(function (a, b) {
    if (by === "priority") return order[a.pri] - order[b.pri];
    if (by === "name") return a.name.localeCompare(b.name);
    return a.date.localeCompare(b.date);
  });

  var html = "";
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    html += '<div class="habit ' + h.pri + " " + (h.status === "Done" ? "Done" : "") + '">' +
      "<h4>" + icons[h.cat] + " " + clean(h.name) + "</h4>" +
      "<small>" + h.cat + " | " + h.pri + " priority | 📅 " + h.date + " | 🔁 " + h.sch + " | Status: <b>" + h.status + "</b></small><br>" +
      '<button onclick="changeStatus(' + h.id + ')">✅ Change status</button>' +
      '<button onclick="editHabit(' + h.id + ')">✏️ Edit</button>' +
      '<button class="del" onclick="deleteHabit(' + h.id + ')">🗑️ Delete</button>' +
      "</div>";
  }
  if (html === "") html = "<p>No habits found. Add one from the first tab! 🌱</p>";
  $("habitList").innerHTML = html;
}

// ---------- dashboard ----------
function showDashboard() {
  var done = 0, prog = 0, pend = 0;
  var cats = {};

  for (var i = 0; i < habits.length; i++) {
    if (habits[i].status === "Done") done++;
    else if (habits[i].status === "In Progress") prog++;
    else pend++;
    cats[habits[i].cat] = (cats[habits[i].cat] || 0) + 1;
  }

  $("stats").innerHTML =
    '<div class="stat"><b>' + habits.length + "</b>📌 Total</div>" +
    '<div class="stat"><b>' + done + "</b>✅ Done</div>" +
    '<div class="stat"><b>' + prog + "</b>⏳ In Progress</div>" +
    '<div class="stat"><b>' + pend + "</b>🕒 Pending</div>";

  // done = full, in progress = half
  var percent = habits.length === 0 ? 0 : Math.round(((done + prog * 0.5) / habits.length) * 100);
  $("pct").innerText = percent + "%";
  $("barFill").style.width = percent + "%";

  var c = "";
  for (var name in cats) {
    c += "<p>" + icons[name] + " " + name + ": " + cats[name] + "</p>";
  }
  $("catStats").innerHTML = c || "<p>Nothing here yet.</p>";
}

// ---------- reminders ----------
function showReminders() {
  var due = habits.filter(function (h) {
    return h.status !== "Done" && h.date <= today();
  });
  if (due.length === 0) { $("reminderBox").classList.add("hidden"); return; }

  var names = due.map(function (h) { return clean(h.name); }).join(", ");
  $("reminderBox").innerHTML = "⏰ <b>Reminder:</b> " + due.length + " habit(s) due today or overdue: " + names;
  $("reminderBox").classList.remove("hidden");
}

function showAll() {
  showList();
  showDashboard();
  showReminders();
}

// check reminders again every minute
setInterval(function () { if (me) showReminders(); }, 60000);

// if already logged in, skip the login page
if (me && users.hasOwnProperty(me)) startApp();
