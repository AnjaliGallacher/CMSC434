let userProfile = {};
let userGoals = [];
let userAchievements = [];

function loadProfileData() {
	userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
	document.getElementById("displayUsername").textContent =
		userProfile.username || "User Name";

	const ageText = userProfile.age ? `Age: ${userProfile.age}` : "Age: --";
	const genderText = userProfile.gender
		? `Gender: ${userProfile.gender}`
		: "Gender: --";
	const heightText = userProfile.height_cm
		? `Height: ${userProfile.height_cm} cm`
		: "Height: -- cm";
	const weightText = userProfile.weight_kg
		? `Weight: ${userProfile.weight_kg} kg`
		: "Weight: -- kg";
	document.getElementById(
		"displayUserDetails"
	).textContent = `${ageText} | ${genderText} | ${heightText} | ${weightText}`;

	document.getElementById("displayUserBio").textContent =
		userProfile.bio ||
		"Edit your profile to add a bio and update your details.";

	document.getElementById("statAvgSteps").textContent =
		calculateAvgSteps(30).toLocaleString();
	document.getElementById("statWeeklyRun").textContent =
		calculateWeeklyRunDistance().toFixed(1);
	document.getElementById("statAvgCaloriesBurned").textContent =
		calculateAvgCaloriesBurned(30).toLocaleString();
	document.getElementById("statWeightTrend").textContent =
		calculateWeightTrend(30);
}

function calculateAvgSteps(days) {
	let totalSteps = 0;
	let count = 0;
	const endDate = new Date();
	for (let i = 0; i < days; i++) {
		let date = new Date(endDate);
		date.setDate(endDate.getDate() - i);
		let dateStr = getISODateString(date);
		let dailyLog = JSON.parse(
			localStorage.getItem(`dailyLog_${dateStr}`) || "{}"
		);
		if (dailyLog.steps !== undefined) {
			totalSteps += dailyLog.steps;
			count++;
		}
	}
	return count > 0 ? Math.round(totalSteps / count) : "--";
}

function calculateWeeklyRunDistance() {
	let totalDistance = 0;
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - 6);

	const history = JSON.parse(localStorage.getItem("exerciseHistory") || "[]");
	history.forEach((entry) => {
		const entryDate = entry.exercise_date
			? new Date(entry.exercise_date + "T00:00:00")
			: null;
		if (
			entryDate &&
			entryDate >= startDate &&
			entryDate <= endDate &&
			entry.exercise_type.toLowerCase() === "running"
		) {
			let distKm = parseFloat(entry.exercise_distance) || 0;
			if (entry.exercise_distance_unit === "miles") distKm *= 1.609;
			else if (entry.exercise_distance_unit === "meters") distKm /= 1000;
			else if (entry.exercise_distance_unit === "yards")
				distKm *= 0.0009144;
			totalDistance += distKm;
		}
	});
	return totalDistance;
}

function calculateAvgCaloriesBurned(days) {
	let totalCalories = 0;
	let activeDays = new Set();
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - (days - 1));

	const history = JSON.parse(localStorage.getItem("exerciseHistory") || "[]");
	history.forEach((entry) => {
		const entryDate = entry.exercise_date
			? new Date(entry.exercise_date + "T00:00:00")
			: null;
		if (
			entryDate &&
			entryDate >= startDate &&
			entryDate <= endDate &&
			entry.exercise_calories
		) {
			totalCalories += parseFloat(entry.exercise_calories);
			activeDays.add(entry.exercise_date);
		}
	});
	return activeDays.size > 0
		? Math.round(totalCalories / activeDays.size)
		: "--";
}

function calculateWeightTrend(days) {
	const weightLog = JSON.parse(
		localStorage.getItem("weightLog") || "[]"
	).sort((a, b) => new Date(a.date) - new Date(b.date));
	if (weightLog.length < 1) return "--";

	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - (days - 1));

	const relevantEntries = weightLog.filter((e) => {
		const entryDate = e.date ? new Date(e.date + "T00:00:00") : null;
		return entryDate && entryDate >= startDate && entryDate <= endDate;
	});

	if (relevantEntries.length < 2) {
		return relevantEntries.length === 1
			? `${relevantEntries[0].weight}`
			: "--";
	}

	const startW = relevantEntries[0].weight;
	const endW = relevantEntries[relevantEntries.length - 1].weight;
	const trend = endW - startW;
	const sign = trend > 0 ? "+" : "";
	return `${sign}${trend.toFixed(1)}`;
}

function openEditProfileModal() {
	document.getElementById("editUsername").value = userProfile.username || "";
	document.getElementById("editAge").value = userProfile.age || "";
	document.getElementById("editGender").value = userProfile.gender || "";
	document.getElementById("editHeight").value = userProfile.height_cm || "";
	document.getElementById("editWeight").value = userProfile.weight_kg || "";
	document.getElementById("editBio").value = userProfile.bio || "";
	document.getElementById("editProfileModal").classList.add("active");
}

function closeEditProfileModal() {
	document.getElementById("editProfileModal").classList.remove("active");
}

function saveProfile() {
	const form = document.getElementById("edit-profile-form");
	userProfile.username = form.elements["username"].value.trim();
	userProfile.age = form.elements["age"].value || null;
	userProfile.gender = form.elements["gender"].value || null;
	userProfile.height_cm = form.elements["height_cm"].value || null;
	userProfile.weight_kg = form.elements["weight_kg"].value || null;
	userProfile.bio = form.elements["bio"].value.trim();

	if (!userProfile.username) {
		alert("Username is required.");
		form.elements["username"].focus();
		return;
	}

	localStorage.setItem("userProfile", JSON.stringify(userProfile));

	if (userProfile.weight_kg) {
		const today = getISODateString(new Date());
		logWeightValue(today, userProfile.weight_kg);
	}

	loadProfileData();
	closeEditProfileModal();
	alert("Profile Updated!");
}

function changePicture() {
	alert("Image Upload/Selection feature not implemented in this demo.");
}

function logWeightValue(date, weight) {
	if (!date || isNaN(parseFloat(weight))) return;
	let weightLog = JSON.parse(localStorage.getItem("weightLog") || "[]");
	const existingIndex = weightLog.findIndex((e) => e.date === date);
	if (existingIndex > -1) {
		weightLog[existingIndex].weight = parseFloat(weight);
	} else {
		weightLog.push({ date: date, weight: parseFloat(weight) });
	}
	weightLog.sort((a, b) => new Date(a.date) - new Date(b.date));
	localStorage.setItem("weightLog", JSON.stringify(weightLog));
}

function loadGoals() {
	userGoals = JSON.parse(localStorage.getItem("userGoals") || "[]");
	const list = document.getElementById("goalList");
	const noGoalsMsg = document.getElementById("noGoals");
	list.innerHTML = "";

	if (userGoals.length === 0) {
		noGoalsMsg.classList.remove("d-none");
		return;
	}

	noGoalsMsg.classList.add("d-none");
	userGoals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

	userGoals.forEach((goal) => {
		const item = document.createElement("li");
		item.classList.add("goal-item");
		item.dataset.goalId = goal.id;

		let goalDetailText = "";
		if (goal.targetValue) {
			let unit = "";
			if (goal.type === "steps") unit = "steps/day";
			else if (goal.type === "water") unit = "mL/day";
			else if (goal.type === "exercise_duration") unit = "min/week";
			else if (goal.type === "calories") unit = "kcal/day";
			else if (goal.type === "weight") unit = "kg";
			else if (goal.type === "mindfulness") unit = "min/day";
			else if (goal.type === "frequency") unit = "times/week";
			goalDetailText = `Target: ${goal.targetValue} ${unit}`;
		} else if (goal.type === "custom") {
			goalDetailText = "Milestone Goal";
		}
		if (goal.deadline) goalDetailText += ` (Due: ${goal.deadline})`;

		item.innerHTML = `
            <div class="goal-info">
                <div class="goal-name">${goal.name}</div>
                <div class="goal-details">${goalDetailText}</div>
                ${
					goal.notes
						? `<div class="goal-details" style="margin-top: 5px; font-style: italic;">Notes: ${goal.notes}</div>`
						: ""
				}
            </div>
            <div class="goal-actions">
                <button class="action-icon" title="Edit Goal" onclick="editGoal('${
					goal.id
				}')">✏️</button>
                <button class="action-icon" title="Delete Goal" onclick="deleteGoal('${
					goal.id
				}')" style="color: var(--accent-red);">🗑️</button>
            </div>
        `;
		list.appendChild(item);
	});
}

function openAddGoalModal() {
	document.getElementById("add-goal-form").reset();
	document.getElementById("editGoalId").value = "";
	document.getElementById("goalModalTitle").textContent = "Add New Goal";
	document.getElementById("addGoalModal").classList.add("active");
}

function closeAddGoalModal() {
	document.getElementById("addGoalModal").classList.remove("active");
}

function saveGoal() {
	const form = document.getElementById("add-goal-form");
	const goalId = form.elements["goal_id"].value;
	const goalName = form.elements["goal_name"].value.trim();
	const goalType = form.elements["goal_type"].value;

	if (!goalName || !goalType) {
		alert("Please enter a goal description and select a type.");
		return;
	}

	const existingGoal = goalId ? userGoals.find((g) => g.id === goalId) : null;

	const goalData = {
		id: goalId || Date.now().toString(),
		name: goalName,
		type: goalType,
		targetValue: form.elements["goal_target_value"].value || null,
		deadline: form.elements["goal_deadline"].value || null,
		notes: form.elements["goal_notes"].value.trim() || null,
		createdAt: existingGoal?.createdAt || new Date().toISOString(),
		status: existingGoal?.status || "active",
	};

	if (goalId) {
		const index = userGoals.findIndex((g) => g.id === goalId);
		if (index > -1) userGoals[index] = goalData;
	} else {
		userGoals.push(goalData);
	}

	localStorage.setItem("userGoals", JSON.stringify(userGoals));
	loadGoals();
	closeAddGoalModal();
}

function editGoal(goalId) {
	const goal = userGoals.find((g) => g.id === goalId);
	if (!goal) return;

	document.getElementById("editGoalId").value = goal.id;
	document.getElementById("goalName").value = goal.name;
	document.getElementById("goalType").value = goal.type;
	document.getElementById("goalTargetValue").value = goal.targetValue || "";
	document.getElementById("goalDeadline").value = goal.deadline || "";
	document.getElementById("goalNotes").value = goal.notes || "";
	document.getElementById("goalModalTitle").textContent = "Edit Goal";
	document.getElementById("addGoalModal").classList.add("active");
}

function deleteGoal(goalId) {
	if (confirm("Are you sure you want to delete this goal?")) {
		userGoals = userGoals.filter((g) => g.id !== goalId);
		localStorage.setItem("userGoals", JSON.stringify(userGoals));
		loadGoals();
		loadProfileData();
	}
}

function loadAchievements() {
	userAchievements = JSON.parse(
		localStorage.getItem("userAchievements") || "[]"
	);
	const grid = document.getElementById("achievementsGrid");
	const noAchievementsMsg = document.getElementById("noAchievementsProfile");
	grid.innerHTML = "";

	if (userAchievements.length === 0) {
		noAchievementsMsg.classList.remove("d-none");
		return;
	}

	noAchievementsMsg.classList.add("d-none");
	userAchievements.sort(
		(a, b) => new Date(b.achievedAt || 0) - new Date(a.achievedAt || 0)
	);

	const limitedAchievements = userAchievements.slice(0, 4);
	limitedAchievements.forEach((ach) => {
		const iconColor = ach.color
			? getCssVariable(ach.color)
			: getCssVariable("--primary-color");
		const badge = document.createElement("div");
		badge.classList.add("achievement-badge");
		badge.title = `${ach.name} (Achieved: ${ach.date})`;
		badge.innerHTML = `<div class="achievement-badge-name">${ach.name}</div>`;
		badge.onclick = () =>
			alert(`Achievement: ${ach.name}\nAchieved: ${ach.date}`);
		grid.appendChild(badge);
	});
}

function loadSettings() {
	const notificationsEnabled =
		localStorage.getItem("notificationsEnabled") === "true";
	document
		.getElementById("notificationToggle")
		.classList.toggle("active", notificationsEnabled);
}

function toggleNotifications() {
	const toggle = document.getElementById("notificationToggle");
	const isActive = toggle.classList.toggle("active");
	localStorage.setItem("notificationsEnabled", isActive);
	alert(
		`Daily notifications ${
			isActive ? "enabled" : "disabled"
		}. (Simulation only)`
	);
}

function exportData() {
	try {
		const dataToExport = {
			profile: JSON.parse(localStorage.getItem("userProfile") || "{}"),
			goals: JSON.parse(localStorage.getItem("userGoals") || "[]"),
			achievements: JSON.parse(
				localStorage.getItem("userAchievements") || "[]"
			),
			weightLog: JSON.parse(localStorage.getItem("weightLog") || "[]"),
			mealHistory: JSON.parse(
				localStorage.getItem("mealHistory") || "[]"
			),
			exerciseHistory: JSON.parse(
				localStorage.getItem("exerciseHistory") || "[]"
			),
		};
		const dataStr = JSON.stringify(dataToExport, null, 2);
		const blob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		const dateStr = new Date().toISOString().split("T")[0];
		link.download = `wellness_hub_data_${dateStr}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		alert("Data export initiated. Check your downloads.");
	} catch (e) {
		console.error("Error exporting data:", e);
		alert("Could not export data. See console for details.");
	}
}

function logout() {
	if (confirm("Are you sure you want to log out?")) {
		alert("Logging out... (Simulation: Clearing some data)");
		localStorage.removeItem("userProfile");
		localStorage.removeItem("userGoals");
		window.location.href = "todo.shtml";
	}
}

function scrollToSection(sectionId) {
	const element = document.getElementById(sectionId);
	if (element) {
		element.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
	userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
	userGoals = JSON.parse(localStorage.getItem("userGoals") || "[]");
	userAchievements = JSON.parse(
		localStorage.getItem("userAchievements") || "[]"
	);

	loadProfileData();
	loadGoals();
	loadAchievements();
	loadSettings();
});
