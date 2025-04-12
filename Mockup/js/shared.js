// Shared utility functions
function getISODateString(date) {
	return date.toISOString().split("T")[0];
}
function getCssVariable(variable) {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(variable)
		.trim();
}
function navigateTo(url) {
	if (url && url !== "#") window.location.href = url;
}

function showNotifications() {
	const notifications = [
		"Reminder: Log your lunch!",
		"Goal Achieved: 10,000 steps yesterday!",
		"New article available: Benefits of Hydration",
	];
	alert("Notifications:\n\n- " + notifications.join("\n- "));
}

function initializeData() {
	// Create sample data for testing if none exists
	const today = new Date();

	for (let i = 0; i < 35; i++) {
		let pastDate = new Date(today);
		pastDate.setDate(today.getDate() - i);
		let dateStr = getISODateString(pastDate);
		if (!localStorage.getItem(`dailyLog_${dateStr}`)) {
			const log = {
				steps: Math.floor(Math.random() * 8000 + 4000),
				exercise: Math.floor(Math.random() * 75),
				kcal: Math.floor(Math.random() * 1000 + 1500),
				water: Math.floor(Math.random() * 1500 + 1000),
			};
			localStorage.setItem(`dailyLog_${dateStr}`, JSON.stringify(log));
		}
	}
}

function getDateRange(period) {
	const endDate = new Date();
	let startDate = new Date(),
		numDays = 7;

	switch (period) {
		case "30d":
			numDays = 30;
			break;
		case "90d":
			numDays = 90;
			break;
		case "6m":
			numDays = 180;
			break;
		case "1y":
			numDays = 365;
			break;
		case "all":
			const weightLog = JSON.parse(
				localStorage.getItem("weightLog") || "[]"
			);
			const earliestWeight =
				weightLog.length > 0
					? new Date(weightLog[0].date)
					: new Date(2000, 0, 1);
			startDate = earliestWeight;
			return { startDate, endDate };
	}

	startDate.setDate(endDate.getDate() - numDays);
	const minDate = new Date(2000, 0, 1);
	if (startDate < minDate) startDate = minDate;
	return { startDate, endDate };
}

function setDefaultDateTime(dateInputId, timeInputId) {
	const dateInput = document.getElementById(dateInputId);
	const timeInput = document.getElementById(timeInputId);
	const now = new Date();

	if (!dateInput.value) dateInput.value = getISODateString(now);
	if (!timeInput.value) {
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");
		timeInput.value = `${hh}:${mm}`;
	}
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", initializeData);
